#!/usr/bin/python3.12
"""Lambda MicroVM lifecycle hooks and Claude Code session launcher."""

from __future__ import annotations

import base64
import binascii
import gzip
import hashlib
import hmac
import http.client
import io
import json
import logging
import os
import pwd
import re
import shutil
import signal
import ssl
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import parse_qs, quote, urlsplit

try:
    from .vscode_tunnel import (
        CODE_BINARY as VSCODE_CLI_BINARY,
        LINUX_HOME,
        TunnelConfiguration,
        TunnelSupervisor,
        initialize_vscode_storage,
    )
except ImportError:
    from vscode_tunnel import (  # type: ignore[no-redef]
        CODE_BINARY as VSCODE_CLI_BINARY,
        LINUX_HOME,
        TunnelConfiguration,
        TunnelSupervisor,
        initialize_vscode_storage,
    )

LOG = logging.getLogger("claude-microvm-agent")

HOOK_PREFIX = "/aws/lambda-microvms/runtime/v1"
WORKSPACE = Path("/workspace")
DEVELOPER_HOME = WORKSPACE / ".claude-home"
CLAUDE_SETTINGS = DEVELOPER_HOME / ".claude" / "settings.json"
CLAUDE_CONFIG_DIRECTORY = CLAUDE_SETTINGS.parent
DEVELOPER_STATE_DIRECTORY = WORKSPACE / ".developer-state"
TERMINAL_DEFAULTS_MARKER = (
    DEVELOPER_HOME / ".claude-microvm-terminal-defaults.json"
)
MANAGED_DIRECTORY = Path("/etc/claude-code")
STATE_DIRECTORY = Path("/var/lib/claude-microvm")
SESSION_CONFIGURATION = STATE_DIRECTORY / "session.json"
CLAUDE_BINARY = Path("/usr/local/bin/claude")
MCP_BRIDGE = Path(
    "/opt/claude-microvm/bridge/dist/agentcore-mcp-bridge.js"
)

WORKSPACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
SESSION_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,128}$")
OWNER_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")
AWS_REGION_PATTERN = re.compile(r"^[a-z]{2}(?:-gov)?-[a-z]+-\d$")
TUNNEL_NAME_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,20}$")
BEDROCK_MODEL_PATTERN = re.compile(
    r"^(?:us|global)\.anthropic\.claude-[A-Za-z0-9._:-]{1,180}$"
)

MAX_HOOK_BODY_BYTES = 24 * 1024
MAX_RUN_HOOK_PAYLOAD_BYTES = 4 * 1024
MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES = 16 * 1024
COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX = "gzip-base64:"
MAX_CHECKPOINT_BYTES = int(
    os.environ.get("MAX_CHECKPOINT_BYTES", str(128 * 1024 * 1024))
)
MAX_EXTRACTED_BYTES = int(
    os.environ.get("MAX_EXTRACTED_BYTES", str(1024 * 1024 * 1024))
)
MAX_ARCHIVE_MEMBERS = 200_000
CHECKPOINT_TIMEOUT_SECONDS = 50
CONTROL_API_TIMEOUT_SECONDS = 10
REFRESH_URLS_AFTER_SECONDS = 15 * 60
MAX_REFRESH_RESPONSE_BYTES = 64 * 1024
CONTAINER_CREDENTIALS_BASE = "http://169.254.170.2"
CLAUDE_AUTH_STATUS_TIMEOUT_SECONDS = 5
CLAUDE_AUTH_POLL_SECONDS = 0.25
CLAUDE_LOGIN_EXIT_TIMEOUT_SECONDS = 5


@dataclass(frozen=True)
class Session:
    session_id: str
    owner_hash: str
    workspace_id: str
    aws_region: str
    inference_mode: str
    claude_gateway_url: str | None
    bedrock_model_id: str | None
    agentcore_gateway_url: str | None
    checkpoint_download_url: str | None
    checkpoint_upload_url: str
    microvm_id: str
    control_api_url: str | None = None
    access_mode: str = "terminal"
    tunnel_name: str | None = None


@dataclass(frozen=True)
class CheckpointUrls:
    download_url: str | None
    upload_url: str
    issued_at_monotonic: float


@dataclass(frozen=True)
class AwsCredentials:
    access_key_id: str
    secret_access_key: str
    session_token: str | None


class CheckpointForbiddenError(RuntimeError):
    pass


class Runtime:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._session: Session | None = None
        self._checkpoint_client: PresignedCheckpointClient | None = None
        self._checkpoint_current = False
        self._tunnel = TunnelSupervisor()

    def ready(self) -> None:
        self._validate_image()

    def validate(self) -> None:
        self._validate_image()

    def run(self, request: dict[str, Any]) -> None:
        session = parse_run_request(request)
        with self._lock:
            if self._session:
                if self._session != session:
                    raise ValueError("A different session is already initialized")
                return

            STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
            self._checkpoint_client = checkpoint_client_for(session)
            checkpoint = self._checkpoint_client.download()
            try:
                if checkpoint:
                    restore_workspace(checkpoint)
                else:
                    reset_workspace()
            finally:
                if checkpoint:
                    checkpoint.unlink(missing_ok=True)

            initialize_developer_home()
            initialize_linux_home()
            write_terminal_defaults()
            write_managed_configuration(session)
            write_session_configuration(session)
            if session.access_mode == "vscode":
                initialize_vscode_storage(
                    inference_mode=session.inference_mode,
                )
            self._tunnel.configure(
                TunnelConfiguration(
                    enabled=session.access_mode == "vscode",
                    tunnel_name=session.tunnel_name,
                    environment=session_environment(session),
                )
            )
            self._session = session
            self._checkpoint_current = False
            LOG.info(
                "session initialized",
                extra={
                    "session_id": session.session_id,
                    "microvm_id": session.microvm_id,
                },
            )

    def suspend(self) -> None:
        with self._lock:
            self._tunnel.pause()
            self._checkpoint_if_needed("suspend")

    def resume(self) -> None:
        with self._lock:
            if not self._session:
                raise RuntimeError("Session has not been initialized")
            self._checkpoint_current = False
            self._tunnel.resume()
            LOG.info("session resumed")

    def terminate(self) -> None:
        with self._lock:
            self._tunnel.terminate(cleanup_identity=False)
            try:
                self._checkpoint_if_needed("terminate")
            finally:
                self._tunnel.terminate(cleanup_identity=True)

    def shutdown_checkpoint(self) -> None:
        with self._lock:
            self._tunnel.pause()
            self._checkpoint_if_needed("shutdown")

    def close(self) -> None:
        self._tunnel.close()

    def _checkpoint_if_needed(self, operation: str) -> None:
        if not self._session:
            return
        if self._checkpoint_current:
            LOG.info("workspace checkpoint already current for %s", operation)
            return
        if self._checkpoint_client is None:
            self._checkpoint_client = checkpoint_client_for(self._session)
        archive = create_workspace_archive()
        try:
            self._checkpoint_client.upload(archive)
            self._checkpoint_current = True
            LOG.info(
                "workspace checkpoint uploaded",
                extra={
                    "operation": operation,
                    "bytes": archive.stat().st_size,
                },
            )
        finally:
            archive.unlink(missing_ok=True)

    def _validate_image(self) -> None:
        if os.geteuid() != 0:
            raise RuntimeError("Lifecycle agent must run as root")
        pwd.getpwnam("developer")
        for path in (CLAUDE_BINARY, VSCODE_CLI_BINARY, MCP_BRIDGE):
            if not path.is_file():
                raise RuntimeError(f"Required runtime file is missing: {path}")
        if not os.access(CLAUDE_BINARY, os.X_OK):
            raise RuntimeError("Claude Code binary is not executable")
        if not os.access(VSCODE_CLI_BINARY, os.X_OK):
            raise RuntimeError("VS Code CLI binary is not executable")
        MANAGED_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o755)
        STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)


class PresignedCheckpointClient:
    def __init__(
        self,
        session: Session,
        *,
        refresher: CheckpointUrlRefresher | None = None,
        connection_factory: Callable[
            [CheckpointTarget], http.client.HTTPSConnection
        ]
        | None = None,
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        self._session = session
        self._refresher = refresher
        self._connection_factory = connection_factory or self._connection
        self._monotonic = monotonic
        if session.checkpoint_download_url:
            validated_checkpoint_url(
                session.checkpoint_download_url,
                session.aws_region,
            )
        validated_checkpoint_url(
            session.checkpoint_upload_url,
            session.aws_region,
        )
        self._urls = CheckpointUrls(
            download_url=session.checkpoint_download_url,
            upload_url=session.checkpoint_upload_url,
            issued_at_monotonic=monotonic(),
        )

    @property
    def urls(self) -> CheckpointUrls:
        return self._urls

    def download(self) -> Path | None:
        self._refresh_if_stale()
        if not self._urls.download_url:
            return None
        try:
            return self._download_once()
        except CheckpointForbiddenError:
            if not self._refresh("download returned HTTP 403"):
                raise
            if not self._urls.download_url:
                return None
            return self._download_once()

    def upload(self, archive: Path) -> None:
        size = archive.stat().st_size
        if size > MAX_CHECKPOINT_BYTES:
            raise RuntimeError(
                f"Compressed checkpoint is {size} bytes; "
                f"limit is {MAX_CHECKPOINT_BYTES}"
            )
        self._refresh_if_stale()
        try:
            self._upload_once(archive, size)
        except CheckpointForbiddenError:
            if not self._refresh("upload returned HTTP 403"):
                raise
            self._upload_once(archive, size)

    def _refresh_if_stale(self) -> None:
        if self._refresher is None:
            return
        age = self._monotonic() - self._urls.issued_at_monotonic
        if age < REFRESH_URLS_AFTER_SECONDS:
            return
        self._refresh(f"urls are {int(age)} seconds old")

    def _refresh(self, reason: str) -> bool:
        if self._refresher is None:
            return False
        try:
            download_url, upload_url = self._refresher.fetch()
            if download_url is not None:
                validated_checkpoint_url(
                    download_url, self._session.aws_region
                )
            validated_checkpoint_url(upload_url, self._session.aws_region)
        except Exception as error:
            LOG.warning(
                "checkpoint URL refresh failed (%s): %s", reason, error
            )
            return False
        self._urls = CheckpointUrls(
            download_url=download_url,
            upload_url=upload_url,
            issued_at_monotonic=self._monotonic(),
        )
        LOG.info("checkpoint URLs refreshed (%s)", reason)
        return True

    def _download_once(self) -> Path | None:
        if not self._urls.download_url:
            return None
        target = checkpoint_target(
            self._urls.download_url, self._session.aws_region
        )
        connection = self._connection_factory(target)
        try:
            connection.request("GET", target.request_target)
            response = connection.getresponse()
            if response.status == 404:
                response.read()
                return None
            if response.status != 200:
                response.read(64 * 1024)
                if response.status == 403:
                    raise CheckpointForbiddenError(
                        "Checkpoint download failed with HTTP 403"
                    )
                raise RuntimeError(
                    f"Checkpoint download failed with HTTP {response.status}"
                )
            expected = parse_content_length(
                response.getheader("Content-Length")
            )
            if expected is not None and expected > MAX_CHECKPOINT_BYTES:
                raise RuntimeError("Checkpoint exceeds the configured size limit")

            descriptor, name = tempfile.mkstemp(
                prefix="checkpoint-download-",
                suffix=".tar.gz",
                dir=STATE_DIRECTORY,
            )
            received = 0
            try:
                with os.fdopen(descriptor, "wb") as destination:
                    while chunk := response.read(1024 * 1024):
                        received += len(chunk)
                        if received > MAX_CHECKPOINT_BYTES:
                            raise RuntimeError(
                                "Checkpoint exceeds the configured size limit"
                            )
                        destination.write(chunk)
                    destination.flush()
                    os.fsync(destination.fileno())
                if expected is not None and received != expected:
                    raise RuntimeError("Checkpoint download was truncated")
                return Path(name)
            except Exception:
                Path(name).unlink(missing_ok=True)
                raise
        finally:
            connection.close()

    def _upload_once(self, archive: Path, size: int) -> None:
        target = checkpoint_target(
            self._urls.upload_url, self._session.aws_region
        )
        connection = self._connection_factory(target)
        try:
            connection.putrequest("PUT", target.request_target)
            connection.putheader("Content-Type", "application/gzip")
            connection.putheader("Content-Length", str(size))
            connection.endheaders()
            with archive.open("rb") as source:
                while chunk := source.read(1024 * 1024):
                    connection.send(chunk)
            response = connection.getresponse()
            response.read(64 * 1024)
            if response.status == 403:
                raise CheckpointForbiddenError(
                    "Checkpoint upload failed with HTTP 403"
                )
            if response.status != 200:
                raise RuntimeError(
                    f"Checkpoint upload failed with HTTP {response.status}"
                )
        finally:
            connection.close()

    @staticmethod
    def _connection(target: "CheckpointTarget") -> http.client.HTTPSConnection:
        return http.client.HTTPSConnection(
            target.hostname,
            target.port,
            timeout=CHECKPOINT_TIMEOUT_SECONDS,
            context=ssl.create_default_context(),
        )


@dataclass(frozen=True)
class CheckpointTarget:
    hostname: str
    port: int
    request_target: str


def checkpoint_client_for(session: Session) -> PresignedCheckpointClient:
    refresher = (
        CheckpointUrlRefresher(session) if session.control_api_url else None
    )
    return PresignedCheckpointClient(session, refresher=refresher)


class CheckpointUrlRefresher:
    def __init__(
        self,
        session: Session,
        *,
        credentials_provider: Callable[[], AwsCredentials] | None = None,
        connection_factory: Callable[
            [str, int], http.client.HTTPSConnection
        ]
        | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        if not session.control_api_url:
            raise ValueError("Session has no controlApiUrl")
        self._session = session
        self._credentials_provider = (
            credentials_provider or fetch_container_credentials
        )
        self._connection_factory = connection_factory or self._connection
        self._clock = clock or (lambda: datetime.now(timezone.utc))

    def fetch(self) -> tuple[str | None, str]:
        url = (
            f"{self._session.control_api_url}/sessions/"
            f"{quote(self._session.session_id, safe='')}/checkpoint-urls"
        )
        body = json.dumps(
            {"microvmId": self._session.microvm_id},
            separators=(",", ":"),
        ).encode()
        headers = sign_sigv4_request(
            method="POST",
            url=url,
            body=body,
            region=self._session.aws_region,
            service="execute-api",
            credentials=self._credentials_provider(),
            timestamp=self._clock(),
        )
        headers["Content-Type"] = "application/json"
        parsed = urlsplit(url)
        connection = self._connection_factory(
            parsed.hostname or "", parsed.port or 443
        )
        try:
            request_target = parsed.path or "/"
            connection.request("POST", request_target, body, headers)
            response = connection.getresponse()
            encoded = response.read(MAX_REFRESH_RESPONSE_BYTES)
            if response.status != 200:
                raise RuntimeError(
                    f"Checkpoint URL refresh failed with HTTP "
                    f"{response.status}"
                )
        finally:
            connection.close()
        try:
            value = json.loads(encoded)
        except json.JSONDecodeError as error:
            raise RuntimeError(
                "Checkpoint URL refresh response is not valid JSON"
            ) from error
        if not isinstance(value, dict):
            raise RuntimeError(
                "Checkpoint URL refresh response must be an object"
            )
        upload_url = value.get("uploadUrl")
        if not isinstance(upload_url, str) or not upload_url:
            raise RuntimeError(
                "Checkpoint URL refresh response is missing uploadUrl"
            )
        download_value = value.get("downloadUrl")
        download_url = (
            download_value
            if isinstance(download_value, str) and download_value
            else None
        )
        return download_url, upload_url

    @staticmethod
    def _connection(
        hostname: str, port: int
    ) -> http.client.HTTPSConnection:
        return http.client.HTTPSConnection(
            hostname,
            port,
            timeout=CONTROL_API_TIMEOUT_SECONDS,
            context=ssl.create_default_context(),
        )


def sign_sigv4_request(
    *,
    method: str,
    url: str,
    body: bytes,
    region: str,
    service: str,
    credentials: AwsCredentials,
    timestamp: datetime,
) -> dict[str, str]:
    parsed = urlsplit(url)
    hostname = parsed.hostname or ""
    if not hostname or parsed.query:
        raise ValueError("SigV4 request URL is invalid")
    host = (
        hostname
        if parsed.port in (None, 443)
        else f"{hostname}:{parsed.port}"
    )
    amz_date = timestamp.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = timestamp.strftime("%Y%m%d")
    canonical_uri = quote(parsed.path or "/", safe="/-_.~")
    payload_hash = hashlib.sha256(body).hexdigest()

    signed_pairs = [("host", host), ("x-amz-date", amz_date)]
    if credentials.session_token:
        signed_pairs.append(
            ("x-amz-security-token", credentials.session_token)
        )
    canonical_headers = "".join(
        f"{name}:{value}\n" for name, value in signed_pairs
    )
    signed_headers = ";".join(name for name, _ in signed_pairs)
    canonical_request = "\n".join(
        (
            method,
            canonical_uri,
            "",
            canonical_headers,
            signed_headers,
            payload_hash,
        )
    )
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        (
            "AWS4-HMAC-SHA256",
            amz_date,
            credential_scope,
            hashlib.sha256(canonical_request.encode()).hexdigest(),
        )
    )

    def hmac_sha256(key: bytes, message: str) -> bytes:
        return hmac.new(key, message.encode(), hashlib.sha256).digest()

    signing_key = hmac_sha256(
        hmac_sha256(
            hmac_sha256(
                hmac_sha256(
                    f"AWS4{credentials.secret_access_key}".encode(),
                    date_stamp,
                ),
                region,
            ),
            service,
        ),
        "aws4_request",
    )
    signature = hmac.new(
        signing_key, string_to_sign.encode(), hashlib.sha256
    ).hexdigest()

    headers = {
        "Host": host,
        "X-Amz-Date": amz_date,
        "Authorization": (
            "AWS4-HMAC-SHA256 "
            f"Credential={credentials.access_key_id}/{credential_scope}, "
            f"SignedHeaders={signed_headers}, "
            f"Signature={signature}"
        ),
    }
    if credentials.session_token:
        headers["X-Amz-Security-Token"] = credentials.session_token
    return headers


def fetch_container_credentials() -> AwsCredentials:
    full_uri = os.environ.get("AWS_CONTAINER_CREDENTIALS_FULL_URI")
    relative_uri = os.environ.get("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI")
    if full_uri:
        uri = full_uri
    elif relative_uri:
        uri = CONTAINER_CREDENTIALS_BASE + relative_uri
    else:
        raise RuntimeError("Container credentials endpoint is not configured")

    parsed = urlsplit(uri)
    hostname = parsed.hostname or ""
    if parsed.scheme not in ("http", "https") or not hostname:
        raise RuntimeError("Container credentials endpoint is invalid")
    connection: http.client.HTTPConnection
    if parsed.scheme == "https":
        connection = http.client.HTTPSConnection(
            hostname,
            parsed.port or 443,
            timeout=CONTROL_API_TIMEOUT_SECONDS,
            context=ssl.create_default_context(),
        )
    else:
        connection = http.client.HTTPConnection(
            hostname,
            parsed.port or 80,
            timeout=CONTROL_API_TIMEOUT_SECONDS,
        )
    headers: dict[str, str] = {}
    token = container_authorization_token()
    if token:
        headers["Authorization"] = token
    request_target = parsed.path or "/"
    if parsed.query:
        request_target += f"?{parsed.query}"
    try:
        connection.request("GET", request_target, headers=headers)
        response = connection.getresponse()
        encoded = response.read(MAX_REFRESH_RESPONSE_BYTES)
        if response.status != 200:
            raise RuntimeError(
                f"Container credentials request failed with HTTP "
                f"{response.status}"
            )
    finally:
        connection.close()
    try:
        value = json.loads(encoded)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Container credentials response is not valid JSON"
        ) from error
    if not isinstance(value, dict):
        raise RuntimeError("Container credentials response must be an object")
    access_key_id = value.get("AccessKeyId")
    secret_access_key = value.get("SecretAccessKey")
    if not isinstance(access_key_id, str) or not isinstance(
        secret_access_key, str
    ):
        raise RuntimeError("Container credentials response is incomplete")
    token_value = value.get("Token")
    return AwsCredentials(
        access_key_id=access_key_id,
        secret_access_key=secret_access_key,
        session_token=token_value if isinstance(token_value, str) else None,
    )


def container_authorization_token() -> str | None:
    token = os.environ.get("AWS_CONTAINER_AUTHORIZATION_TOKEN")
    if token:
        return token.strip()
    token_file = os.environ.get("AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE")
    if token_file:
        return Path(token_file).read_text(encoding="utf-8").strip()
    return None


class HookHandler(BaseHTTPRequestHandler):
    server_version = "claude-microvm-agent"
    sys_version = ""

    def do_POST(self) -> None:  # noqa: N802
        try:
            body = self._read_json_body()
            operation = self.path.removeprefix(f"{HOOK_PREFIX}/")
            if self.path == f"{HOOK_PREFIX}/ready":
                RUNTIME.ready()
            elif self.path == f"{HOOK_PREFIX}/validate":
                RUNTIME.validate()
            elif self.path == f"{HOOK_PREFIX}/run":
                RUNTIME.run(body)
            elif self.path == f"{HOOK_PREFIX}/resume":
                RUNTIME.resume()
            elif self.path == f"{HOOK_PREFIX}/suspend":
                RUNTIME.suspend()
            elif self.path == f"{HOOK_PREFIX}/terminate":
                RUNTIME.terminate()
            else:
                self._json_response(404, {"message": "Not found"})
                return
            self._json_response(200, {"operation": operation, "ok": True})
        except (ValueError, TypeError, KeyError) as error:
            LOG.warning("invalid lifecycle request: %s", error)
            self._json_response(400, {"message": "Invalid lifecycle request"})
        except Exception:
            LOG.exception("lifecycle operation failed")
            self._json_response(500, {"message": "Lifecycle operation failed"})

    def do_GET(self) -> None:  # noqa: N802
        self._json_response(405, {"message": "Method not allowed"})

    def log_message(self, format_string: str, *args: object) -> None:
        LOG.info("hook http: " + format_string, *args)

    def _read_json_body(self) -> dict[str, Any]:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError as error:
            raise ValueError("Invalid Content-Length") from error
        if length < 0 or length > MAX_HOOK_BODY_BYTES:
            raise ValueError("Lifecycle body is too large")
        encoded = self.rfile.read(length)
        if not encoded:
            return {}
        try:
            value = json.loads(encoded)
        except json.JSONDecodeError as error:
            raise ValueError("Lifecycle body is not valid JSON") from error
        if not isinstance(value, dict):
            raise ValueError("Lifecycle body must be an object")
        return value

    def _json_response(self, status: int, value: dict[str, Any]) -> None:
        encoded = json.dumps(value, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(encoded)


class HookServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def parse_run_request(request: dict[str, Any]) -> Session:
    microvm_id = required_string(request, "microvmId", 256)
    encoded_payload = required_string(
        request,
        "runHookPayload",
        MAX_RUN_HOOK_PAYLOAD_BYTES,
    )
    try:
        payload = json.loads(decode_run_hook_payload(encoded_payload))
    except json.JSONDecodeError as error:
        raise ValueError("runHookPayload is not valid JSON") from error
    if not isinstance(payload, dict):
        raise ValueError("Unsupported run hook payload")
    payload_version = payload.get("version")
    if payload_version not in (2, 3):
        raise ValueError("Unsupported run hook payload")

    session_id = required_string(payload, "sessionId", 128)
    owner_hash = required_string(payload, "ownerHash", 64)
    workspace_id = required_string(payload, "workspaceId", 64)
    aws_region = required_string(payload, "awsRegion", 32)
    if not AWS_REGION_PATTERN.fullmatch(aws_region):
        raise ValueError("Invalid awsRegion")
    inference_mode = required_string(payload, "inferenceMode", 32)
    if inference_mode not in ("claude-gateway", "bedrock", "claude-ai"):
        raise ValueError("Unsupported inferenceMode")
    claude_gateway_url = (
        validated_url(
            required_string(payload, "claudeGatewayUrl", 2048),
            schemes={"https"},
            label="claudeGatewayUrl",
        )
        if inference_mode == "claude-gateway"
        else None
    )
    bedrock_model_id = (
        required_string(payload, "bedrockModelId", 220)
        if inference_mode == "bedrock"
        else None
    )
    if (
        bedrock_model_id is not None
        and not BEDROCK_MODEL_PATTERN.fullmatch(bedrock_model_id)
    ):
        raise ValueError("Invalid bedrockModelId")
    agentcore_value = payload.get("agentCoreGatewayUrl")
    agentcore_gateway_url = (
        validated_url(
            agentcore_value,
            schemes={"https"},
            label="agentCoreGatewayUrl",
        )
        if isinstance(agentcore_value, str) and agentcore_value
        else None
    )
    checkpoint = payload.get("checkpoint")
    if not isinstance(checkpoint, dict):
        raise ValueError("checkpoint must be an object")
    download_value = checkpoint.get("downloadUrl")
    checkpoint_download_url = (
        validated_checkpoint_url(download_value, aws_region)
        if isinstance(download_value, str) and download_value
        else None
    )
    checkpoint_upload_url = validated_checkpoint_url(
        required_string(checkpoint, "uploadUrl", 8_000),
        aws_region,
    )
    control_api_value = payload.get("controlApiUrl")
    control_api_url = (
        validated_control_api_url(control_api_value, aws_region)
        if isinstance(control_api_value, str) and control_api_value
        else None
    )
    if not SESSION_ID_PATTERN.fullmatch(session_id):
        raise ValueError("Invalid sessionId")
    if not OWNER_HASH_PATTERN.fullmatch(owner_hash):
        raise ValueError("Invalid ownerHash")
    if not WORKSPACE_ID_PATTERN.fullmatch(workspace_id):
        raise ValueError("Invalid workspaceId")
    if agentcore_gateway_url:
        hostname = urlsplit(agentcore_gateway_url).hostname or ""
        if ".gateway.bedrock-agentcore." not in hostname:
            raise ValueError("Unexpected AgentCore Gateway hostname")
    access_mode_value = payload.get("accessMode", "terminal")
    if access_mode_value not in ("terminal", "vscode"):
        raise ValueError("Unsupported accessMode")
    tunnel_name_value = payload.get("tunnelName")
    tunnel_name = (
        tunnel_name_value
        if isinstance(tunnel_name_value, str) and tunnel_name_value
        else None
    )
    if access_mode_value == "vscode":
        if (
            tunnel_name is None
            or not TUNNEL_NAME_PATTERN.fullmatch(tunnel_name)
        ):
            raise ValueError("Invalid tunnelName")
    elif tunnel_name is not None:
        raise ValueError("tunnelName requires vscode accessMode")
    if payload_version == 2 and (
        access_mode_value != "terminal"
        or inference_mode == "claude-ai"
        or tunnel_name is not None
    ):
        raise ValueError(
            "Run hook payload version 3 is required for this session"
        )

    return Session(
        session_id=session_id,
        owner_hash=owner_hash,
        workspace_id=workspace_id,
        aws_region=aws_region,
        inference_mode=inference_mode,
        claude_gateway_url=claude_gateway_url,
        bedrock_model_id=bedrock_model_id,
        agentcore_gateway_url=agentcore_gateway_url,
        checkpoint_download_url=checkpoint_download_url,
        checkpoint_upload_url=checkpoint_upload_url,
        microvm_id=microvm_id,
        control_api_url=control_api_url,
        access_mode=access_mode_value,
        tunnel_name=tunnel_name,
    )


def decode_run_hook_payload(value: str) -> str:
    if not value.startswith(COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX):
        return value

    encoded = value.removeprefix(COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX)
    try:
        compressed = base64.b64decode(encoded, validate=True)
        with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
            decoded = stream.read(MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES + 1)
    except (binascii.Error, EOFError, OSError) as error:
        raise ValueError("runHookPayload compression is invalid") from error
    if len(decoded) > MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES:
        raise ValueError("runHookPayload exceeds the decoded size limit")
    try:
        return decoded.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError("runHookPayload is not valid UTF-8") from error


def required_string(
    value: dict[str, Any], key: str, max_length: int
) -> str:
    result = value.get(key)
    if (
        not isinstance(result, str)
        or not result
        or len(result.encode("utf-8")) > max_length
    ):
        raise ValueError(f"{key} must be a non-empty string")
    return result


def validated_url(value: str, schemes: set[str], label: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme not in schemes
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError(f"{label} is not an approved URL")
    return value.rstrip("/")


def validated_control_api_url(value: str, region: str) -> str:
    parsed = urlsplit(value)
    hostname = parsed.hostname or ""
    if (
        parsed.scheme != "https"
        or not hostname
        or not hostname.endswith(f".execute-api.{region}.amazonaws.com")
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("controlApiUrl is not an approved URL")
    return value.rstrip("/")


def validated_checkpoint_url(value: str, region: str) -> str:
    target = checkpoint_target(value, region)
    if not target.request_target:
        raise ValueError("Checkpoint URL is invalid")
    return value


def checkpoint_target(value: str, region: str) -> CheckpointTarget:
    parsed = urlsplit(value)
    hostname = parsed.hostname or ""
    expected_suffix = f".s3.{region}.amazonaws.com"
    query = parse_qs(parsed.query)
    if (
        parsed.scheme != "https"
        or not hostname
        or (
            hostname != f"s3.{region}.amazonaws.com"
            and not hostname.endswith(expected_suffix)
        )
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 443)
        or parsed.fragment
        or "X-Amz-Signature" not in query
        or "X-Amz-Credential" not in query
    ):
        raise ValueError("Checkpoint URL is not an approved S3 URL")
    return CheckpointTarget(
        hostname=hostname,
        port=parsed.port or 443,
        request_target=f"{parsed.path}?{parsed.query}",
    )


def write_managed_configuration(session: Session) -> None:
    MANAGED_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o755)
    managed_settings: dict[str, Any] = {
        "allowManagedMcpServersOnly": True,
        "allowedMcpServers": [
            {
                "serverCommand": [
                    "/usr/bin/node",
                    str(MCP_BRIDGE),
                    session.agentcore_gateway_url,
                ]
            }
        ]
        if session.agentcore_gateway_url
        else [],
        "env": claude_managed_environment(session),
    }
    if session.inference_mode == "claude-gateway":
        managed_settings.update(
            {
                "forceLoginMethod": "gateway",
                "forceLoginGatewayUrl": session.claude_gateway_url,
            }
        )
    elif session.inference_mode == "claude-ai":
        managed_settings["forceLoginMethod"] = "claudeai"
    mcp_servers: dict[str, Any] = {}
    if session.agentcore_gateway_url:
        mcp_servers["agentcore-governed-tools"] = {
            "type": "stdio",
            "command": "/usr/bin/node",
            "args": [str(MCP_BRIDGE), session.agentcore_gateway_url],
        }
    atomic_json_write(
        MANAGED_DIRECTORY / "managed-settings.json",
        managed_settings,
    )
    atomic_json_write(
        MANAGED_DIRECTORY / "managed-mcp.json",
        {"mcpServers": mcp_servers},
    )


def write_terminal_defaults() -> None:
    if TERMINAL_DEFAULTS_MARKER.exists():
        return

    developer = pwd.getpwnam("developer")
    settings: dict[str, Any] = {}
    if CLAUDE_SETTINGS.exists():
        try:
            value = json.loads(CLAUDE_SETTINGS.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            LOG.warning("could not apply terminal defaults: %s", error)
            return
        if not isinstance(value, dict):
            LOG.warning("could not apply terminal defaults: settings are invalid")
            return
        settings = value

    # Version-one images advertised truecolor and selected "dark". Migrate
    # that known-bad default once, then leave subsequent /theme choices alone.
    if settings.get("theme") in (None, "dark"):
        settings["theme"] = "dark-ansi"
    settings.setdefault("tui", "fullscreen")
    settings.setdefault("prefersReducedMotion", True)

    CLAUDE_SETTINGS.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(CLAUDE_SETTINGS.parent, 0o700)
    os.chown(
        CLAUDE_SETTINGS.parent,
        developer.pw_uid,
        developer.pw_gid,
    )
    atomic_json_write(
        CLAUDE_SETTINGS,
        settings,
        mode=0o600,
        owner=developer.pw_uid,
        group=developer.pw_gid,
    )
    atomic_json_write(
        TERMINAL_DEFAULTS_MARKER,
        {"version": 1},
        mode=0o600,
        owner=developer.pw_uid,
        group=developer.pw_gid,
    )


def session_environment(session: Session) -> dict[str, str]:
    inherited_environment = {
        key: value
        for key, value in os.environ.items()
        if key
        in {
            "AWS_CONTAINER_AUTHORIZATION_TOKEN",
            "AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE",
            "AWS_CONTAINER_CREDENTIALS_FULL_URI",
            "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
            "AWS_EC2_METADATA_DISABLED",
        }
    }
    environment = {
        **inherited_environment,
        "AWS_REGION": session.aws_region,
        "AWS_DEFAULT_REGION": session.aws_region,
        "HOME": str(LINUX_HOME),
        "USER": "developer",
        "LOGNAME": "developer",
        "SHELL": "/bin/bash",
        "TERM": "xterm-256color",
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "CLAUDE_CONFIG_DIR": str(CLAUDE_CONFIG_DIRECTORY),
        "DISABLE_AUTOUPDATER": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        "CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL": "1",
        "GIT_CONFIG_GLOBAL": str(
            DEVELOPER_STATE_DIRECTORY / "gitconfig"
        ),
        "HISTFILE": str(DEVELOPER_STATE_DIRECTORY / "bash_history"),
    }
    environment.update(claude_provider_environment(session))
    return environment


def claude_provider_environment(session: Session) -> dict[str, str]:
    if session.inference_mode == "bedrock":
        return {
            "CLAUDE_CODE_USE_BEDROCK": "1",
            "ANTHROPIC_MODEL": session.bedrock_model_id or "",
        }
    if (
        session.inference_mode == "claude-gateway"
        and session.claude_gateway_url
    ):
        return {"ANTHROPIC_BASE_URL": session.claude_gateway_url}
    return {}


def claude_managed_environment(session: Session) -> dict[str, str]:
    return {
        "AWS_DEFAULT_REGION": session.aws_region,
        "AWS_REGION": session.aws_region,
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        "CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL": "1",
        "CLAUDE_CONFIG_DIR": str(CLAUDE_CONFIG_DIRECTORY),
        "DISABLE_AUTOUPDATER": "1",
        **claude_provider_environment(session),
    }


def write_session_configuration(session: Session) -> None:
    environment = session_environment(session)
    developer = pwd.getpwnam("developer")
    STATE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    os.chown(STATE_DIRECTORY, 0, developer.pw_gid)
    os.chmod(STATE_DIRECTORY, 0o750)
    atomic_json_write(
        SESSION_CONFIGURATION,
        {
            "environment": environment,
            "vscode": {
                "enabled": session.access_mode == "vscode",
                "tunnelName": session.tunnel_name,
            },
        },
        mode=0o640,
        owner=0,
        group=developer.pw_gid,
    )


def launch_claude() -> None:
    developer = pwd.getpwnam("developer")
    if os.geteuid() != developer.pw_uid:
        raise RuntimeError("claude-session must run as the developer user")
    try:
        value = json.loads(SESSION_CONFIGURATION.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Session configuration is unavailable") from error
    environment = value.get("environment") if isinstance(value, dict) else None
    if not isinstance(environment, dict) or not all(
        isinstance(key, str) and isinstance(item, str)
        for key, item in environment.items()
    ):
        raise RuntimeError("Session environment is invalid")
    os.chdir(WORKSPACE)
    os.umask(0o027)
    if (
        environment.get("ANTHROPIC_BASE_URL")
        and not claude_is_authenticated(environment)
        and not complete_gateway_login(environment)
    ):
        raise SystemExit(0)
    os.execve(
        str(CLAUDE_BINARY),
        [str(CLAUDE_BINARY)],
        environment,
    )


def claude_is_authenticated(environment: dict[str, str]) -> bool:
    try:
        result = subprocess.run(
            [str(CLAUDE_BINARY), "auth", "status"],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=environment,
            timeout=CLAUDE_AUTH_STATUS_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0


def complete_gateway_login(environment: dict[str, str]) -> bool:
    child = subprocess.Popen(
        [str(CLAUDE_BINARY)],
        env=environment,
    )
    previous_sigint = signal.signal(signal.SIGINT, lambda _signum, _frame: None)
    try:
        while child.poll() is None:
            if claude_is_authenticated(environment):
                stop_process(child)
                return True
            time.sleep(CLAUDE_AUTH_POLL_SECONDS)
        return claude_is_authenticated(environment)
    finally:
        signal.signal(signal.SIGINT, previous_sigint)
        if child.poll() is None:
            stop_process(child)


def stop_process(child: subprocess.Popen[bytes]) -> None:
    child.terminate()
    try:
        child.wait(timeout=CLAUDE_LOGIN_EXIT_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        child.kill()
        child.wait(timeout=CLAUDE_LOGIN_EXIT_TIMEOUT_SECONDS)


def atomic_json_write(
    path: Path,
    value: dict[str, Any],
    *,
    mode: int = 0o644,
    owner: int = 0,
    group: int = 0,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(
        prefix=f".{path.name}.", dir=path.parent
    )
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as destination:
            json.dump(value, destination, separators=(",", ":"), sort_keys=True)
            destination.write("\n")
            destination.flush()
            os.fsync(destination.fileno())
        os.chmod(temporary, mode)
        os.chown(temporary, owner, group)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def reset_workspace() -> None:
    staging = Path(
        tempfile.mkdtemp(prefix="workspace-empty-", dir=STATE_DIRECTORY)
    )
    install_workspace(staging)


def restore_workspace(archive: Path) -> None:
    staging = Path(
        tempfile.mkdtemp(prefix="workspace-restore-", dir=STATE_DIRECTORY)
    )
    try:
        extract_archive_safely(archive, staging)
        install_workspace(staging)
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def install_workspace(staging: Path) -> None:
    if WORKSPACE.exists():
        shutil.rmtree(WORKSPACE)
    os.replace(staging, WORKSPACE)
    os.chmod(WORKSPACE, 0o750)
    chown_tree(WORKSPACE, "developer")


def initialize_developer_home() -> None:
    developer = pwd.getpwnam("developer")
    DEVELOPER_HOME.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(DEVELOPER_HOME, 0o700)
    os.chown(DEVELOPER_HOME, developer.pw_uid, developer.pw_gid)


def initialize_linux_home() -> None:
    developer = pwd.getpwnam("developer")
    for directory in (LINUX_HOME, DEVELOPER_STATE_DIRECTORY):
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(directory, 0o700)
        os.chown(directory, developer.pw_uid, developer.pw_gid)


def extract_archive_safely(archive: Path, destination: Path) -> None:
    regular_members: list[tuple[tarfile.TarInfo, Path]] = []
    directory_members: list[tuple[tarfile.TarInfo, Path]] = []
    symlink_members: list[tuple[tarfile.TarInfo, Path]] = []
    seen: set[Path] = set()
    extracted_bytes = 0

    with tarfile.open(archive, mode="r:gz") as source:
        members = source.getmembers()
        if len(members) > MAX_ARCHIVE_MEMBERS:
            raise ValueError("Checkpoint contains too many members")
        for member in members:
            relative = safe_member_path(member.name)
            if relative == Path("."):
                continue
            if relative in seen:
                raise ValueError("Checkpoint contains duplicate paths")
            seen.add(relative)
            target = destination / relative
            if member.isdir():
                directory_members.append((member, target))
            elif member.isreg():
                if member.size < 0:
                    raise ValueError("Checkpoint contains an invalid file size")
                extracted_bytes += member.size
                if extracted_bytes > MAX_EXTRACTED_BYTES:
                    raise ValueError(
                        "Checkpoint expands beyond the configured limit"
                    )
                regular_members.append((member, target))
            elif member.issym():
                validate_symlink(relative, member.linkname)
                symlink_members.append((member, target))
            else:
                raise ValueError(
                    f"Checkpoint contains unsupported member: {member.name}"
                )

        for member, target in sorted(
            directory_members, key=lambda item: len(item[1].parts)
        ):
            target.mkdir(parents=True, exist_ok=True)
            os.chmod(target, safe_mode(member.mode, directory=True))

        for member, target in regular_members:
            target.parent.mkdir(parents=True, exist_ok=True)
            source_file = source.extractfile(member)
            if source_file is None:
                raise ValueError("Checkpoint file content is unavailable")
            with source_file, target.open("xb") as destination_file:
                shutil.copyfileobj(source_file, destination_file, 1024 * 1024)
            os.chmod(target, safe_mode(member.mode, directory=False))

        for member, target in symlink_members:
            target.parent.mkdir(parents=True, exist_ok=True)
            os.symlink(member.linkname, target)


def safe_member_path(name: str) -> Path:
    if "\x00" in name:
        raise ValueError("Checkpoint contains a NUL path")
    value = PurePosixPath(name)
    if value.is_absolute():
        raise ValueError("Checkpoint contains an absolute path")
    parts = [part for part in value.parts if part not in ("", ".")]
    if any(part == ".." for part in parts):
        raise ValueError("Checkpoint path escapes the workspace")
    if not parts:
        return Path(".")
    if len(parts) > 256:
        raise ValueError("Checkpoint path is too deep")
    result = Path(*parts)
    if len(str(result).encode("utf-8")) > 4096:
        raise ValueError("Checkpoint path is too long")
    return result


def validate_symlink(relative: Path, linkname: str) -> None:
    link = PurePosixPath(linkname)
    if link.is_absolute() or "\x00" in linkname:
        raise ValueError("Checkpoint contains an unsafe symbolic link")
    depth = len(relative.parent.parts)
    for part in link.parts:
        if part in ("", "."):
            continue
        if part == "..":
            depth -= 1
            if depth < 0:
                raise ValueError("Symbolic link escapes the workspace")
        else:
            depth += 1


def safe_mode(mode: int, directory: bool) -> int:
    permissions = mode & 0o777
    if directory:
        return permissions or 0o750
    return permissions or 0o640


def create_workspace_archive() -> Path:
    STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, name = tempfile.mkstemp(
        prefix="checkpoint-upload-",
        suffix=".tar.gz",
        dir=STATE_DIRECTORY,
    )
    os.close(descriptor)
    archive = Path(name)
    total_bytes = 0

    def archive_filter(member: tarfile.TarInfo) -> tarfile.TarInfo | None:
        nonlocal total_bytes
        member.uid = 1000
        member.gid = 1000
        member.uname = "developer"
        member.gname = "developer"
        member.mode &= 0o777
        if member.isreg():
            total_bytes += member.size
            if total_bytes > MAX_EXTRACTED_BYTES:
                raise RuntimeError(
                    "Workspace exceeds the configured checkpoint limit"
                )
            return member
        if member.isdir():
            return member
        if member.issym():
            relative = safe_member_path(member.name)
            validate_symlink(relative, member.linkname)
            return member
        LOG.warning("skipping unsupported workspace entry: %s", member.name)
        return None

    try:
        with tarfile.open(
            archive, mode="w:gz", compresslevel=6, dereference=False
        ) as destination:
            for child in sorted(WORKSPACE.iterdir(), key=lambda item: item.name):
                destination.add(
                    child,
                    arcname=child.name,
                    recursive=True,
                    filter=archive_filter,
                )
        if archive.stat().st_size > MAX_CHECKPOINT_BYTES:
            raise RuntimeError("Compressed checkpoint exceeds the size limit")
        return archive
    except Exception:
        archive.unlink(missing_ok=True)
        raise


def chown_tree(root: Path, username: str) -> None:
    user = pwd.getpwnam(username)
    os.chown(root, user.pw_uid, user.pw_gid, follow_symlinks=False)
    for directory, directories, files in os.walk(
        root, topdown=True, followlinks=False
    ):
        for name in directories + files:
            path = Path(directory) / name
            os.chown(
                path,
                user.pw_uid,
                user.pw_gid,
                follow_symlinks=False,
            )


def parse_content_length(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        length = int(value)
    except ValueError as error:
        raise RuntimeError("Invalid checkpoint Content-Length") from error
    if length < 0:
        raise RuntimeError("Invalid checkpoint Content-Length")
    return length


logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
RUNTIME = Runtime()
SERVER: HookServer | None = None


def request_shutdown(signum: int, _frame: object) -> None:
    LOG.info("received signal %s", signum)
    threading.Thread(target=shutdown_gracefully, daemon=True).start()


def shutdown_gracefully() -> None:
    try:
        RUNTIME.shutdown_checkpoint()
    except Exception:
        LOG.exception("shutdown checkpoint failed")
    RUNTIME.close()
    if SERVER:
        SERVER.shutdown()


def serve_hooks() -> None:
    global SERVER
    STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
    SERVER = HookServer(("0.0.0.0", 8080), HookHandler)
    signal.signal(signal.SIGTERM, request_shutdown)
    signal.signal(signal.SIGINT, request_shutdown)
    LOG.info("lifecycle hook server listening on port 8080")
    try:
        SERVER.serve_forever(poll_interval=0.5)
    finally:
        RUNTIME.close()
        SERVER.server_close()


if __name__ == "__main__":
    if Path(sys.argv[0]).name == "claude-session" or sys.argv[1:] == [
        "--launch"
    ]:
        launch_claude()
    else:
        serve_hooks()
