#!/usr/bin/env python3
"""AgentCore Runtime HTTP protocol contract server and shell/session helpers.

Implements GET /ping and POST /invocations per the AgentCore Runtime HTTP
protocol contract (port 8080, host 0.0.0.0). Also runs the Claude Code
workspace lifecycle: restore /workspace from the S3 checkpoint on the first
invocation for a runtimeSessionId, and checkpoint back to S3 on a "suspend"
or "terminate" lifecycle command sent through /invocations.

Terminal access itself goes through AWS's InvokeAgentRuntimeCommandShell,
which spawns its own PTY session directly against this container (see
docs/deployment-guide.md); this script does not implement the shell
WebSocket protocol -- AWS's own service handles that framing. This script
only handles the one-shot /invocations lifecycle commands the control plane
sends (session bootstrap, suspend, terminate) and workspace checkpoint I/O.
"""

from __future__ import annotations

import base64
import binascii
import gzip
import hashlib
import http.client
import io
import json
import logging
import os
import pwd
import re
import shutil
import ssl
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import parse_qs, urlsplit

LOG = logging.getLogger("claude-agentcore-agent")

WORKSPACE = Path("/workspace")
DEVELOPER_HOME = WORKSPACE / ".claude-home"
CLAUDE_SETTINGS = DEVELOPER_HOME / ".claude" / "settings.json"
STATE_DIRECTORY = Path("/var/lib/claude-agentcore")
SESSION_CONFIGURATION = STATE_DIRECTORY / "session.json"
CLAUDE_BINARY = Path("/usr/local/bin/claude")

WORKSPACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
SESSION_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,128}$")
OWNER_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")
AWS_REGION_PATTERN = re.compile(r"^[a-z]{2}(?:-gov)?-[a-z]+-\d$")
BEDROCK_MODEL_PATTERN = re.compile(
    r"^(?:(?:us|eu|au|global)\.)?"
    r"anthropic\.claude-[A-Za-z0-9._:-]{1,180}$"
)

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


@dataclass(frozen=True)
class Session:
    session_id: str
    owner_hash: str
    workspace_id: str
    aws_region: str
    inference_mode: str
    bedrock_model_id: str | None
    checkpoint_download_url: str | None
    checkpoint_upload_url: str
    access_mode: str = "terminal"


class Runtime:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._session: Session | None = None
        self._checkpoint_current = False

    def bootstrap(self, payload: str) -> dict[str, Any]:
        session = parse_run_hook_payload(payload)
        with self._lock:
            if self._session and self._session != session:
                raise ValueError("A different session is already initialized")
            if self._session:
                return {"status": "already-initialized"}

            STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
            checkpoint = download_checkpoint(session)
            try:
                if checkpoint:
                    restore_workspace(checkpoint)
                else:
                    reset_workspace()
            finally:
                if checkpoint:
                    checkpoint.unlink(missing_ok=True)

            initialize_developer_home()
            write_terminal_defaults()
            write_session_configuration(session)
            self._session = session
            self._checkpoint_current = False
            LOG.info(
                "session initialized",
                extra={"session_id": session.session_id},
            )
        return {"status": "initialized", "sessionId": session.session_id}

    def checkpoint(self, operation: str) -> dict[str, Any]:
        with self._lock:
            if not self._session:
                return {"status": "no-active-session"}
            if self._checkpoint_current:
                return {"status": "already-current"}
            archive = create_workspace_archive()
            try:
                upload_checkpoint(self._session, archive)
                self._checkpoint_current = True
            finally:
                archive.unlink(missing_ok=True)
        LOG.info("workspace checkpoint uploaded", extra={"operation": operation})
        return {"status": "checkpointed", "operation": operation}


RUNTIME = Runtime()


def parse_run_hook_payload(value: str) -> Session:
    decoded = decode_run_hook_payload(value)
    try:
        payload = json.loads(decoded)
    except json.JSONDecodeError as error:
        raise ValueError("runHookPayload is not valid JSON") from error
    if not isinstance(payload, dict) or payload.get("version") != 1:
        raise ValueError("Unsupported run hook payload")

    session_id = required_string(payload, "sessionId", 128)
    owner_hash = required_string(payload, "ownerHash", 64)
    workspace_id = required_string(payload, "workspaceId", 64)
    aws_region = required_string(payload, "awsRegion", 32)
    if not AWS_REGION_PATTERN.fullmatch(aws_region):
        raise ValueError("Invalid awsRegion")
    inference_mode = required_string(payload, "inferenceMode", 32)
    if inference_mode not in ("bedrock", "claude-ai", "claude-gateway"):
        raise ValueError("Unsupported inferenceMode")
    bedrock_model_id = (
        required_string(payload, "bedrockModelId", 220)
        if inference_mode == "bedrock"
        else None
    )
    if bedrock_model_id is not None and not BEDROCK_MODEL_PATTERN.fullmatch(
        bedrock_model_id
    ):
        raise ValueError("Invalid bedrockModelId")
    checkpoint = payload.get("checkpoint")
    if not isinstance(checkpoint, dict):
        raise ValueError("checkpoint must be an object")
    download_value = checkpoint.get("downloadUrl")
    checkpoint_download_url = (
        download_value if isinstance(download_value, str) and download_value else None
    )
    checkpoint_upload_url = required_string(checkpoint, "uploadUrl", 8_000)

    if not SESSION_ID_PATTERN.fullmatch(session_id):
        raise ValueError("Invalid sessionId")
    if not OWNER_HASH_PATTERN.fullmatch(owner_hash):
        raise ValueError("Invalid ownerHash")
    if not WORKSPACE_ID_PATTERN.fullmatch(workspace_id):
        raise ValueError("Invalid workspaceId")

    return Session(
        session_id=session_id,
        owner_hash=owner_hash,
        workspace_id=workspace_id,
        aws_region=aws_region,
        inference_mode=inference_mode,
        bedrock_model_id=bedrock_model_id,
        checkpoint_download_url=checkpoint_download_url,
        checkpoint_upload_url=checkpoint_upload_url,
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
    return decoded.decode("utf-8")


def required_string(value: dict[str, Any], key: str, max_length: int) -> str:
    result = value.get(key)
    if (
        not isinstance(result, str)
        or not result
        or len(result.encode("utf-8")) > max_length
    ):
        raise ValueError(f"{key} must be a non-empty string")
    return result


def write_terminal_defaults() -> None:
    developer = pwd.getpwnam("developer")
    settings: dict[str, Any] = {}
    if CLAUDE_SETTINGS.exists():
        try:
            value = json.loads(CLAUDE_SETTINGS.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            value = {}
        if isinstance(value, dict):
            settings = value
    settings.setdefault("theme", "dark-ansi")
    settings.setdefault("tui", "fullscreen")
    CLAUDE_SETTINGS.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chown(CLAUDE_SETTINGS.parent, developer.pw_uid, developer.pw_gid)
    atomic_json_write(
        CLAUDE_SETTINGS,
        settings,
        mode=0o600,
        owner=developer.pw_uid,
        group=developer.pw_gid,
    )


def session_environment(session: Session) -> dict[str, str]:
    environment = {
        "AWS_REGION": session.aws_region,
        "AWS_DEFAULT_REGION": session.aws_region,
        "HOME": str(WORKSPACE / ".home"),
        "USER": "developer",
        "SHELL": "/bin/bash",
        "TERM": "xterm-256color",
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "CLAUDE_CONFIG_DIR": str(CLAUDE_SETTINGS.parent),
        "DISABLE_AUTOUPDATER": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    }
    if session.inference_mode == "bedrock" and session.bedrock_model_id:
        environment["CLAUDE_CODE_USE_BEDROCK"] = "1"
        environment["ANTHROPIC_MODEL"] = session.bedrock_model_id
    return environment


def write_session_configuration(session: Session) -> None:
    environment = session_environment(session)
    developer = pwd.getpwnam("developer")
    STATE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    os.chown(STATE_DIRECTORY, 0, developer.pw_gid)
    os.chmod(STATE_DIRECTORY, 0o750)
    atomic_json_write(
        SESSION_CONFIGURATION,
        {"environment": environment},
        mode=0o640,
        owner=0,
        group=developer.pw_gid,
    )


def load_session_environment() -> dict[str, str]:
    try:
        value = json.loads(SESSION_CONFIGURATION.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Session configuration is unavailable") from error
    environment = value.get("environment") if isinstance(value, dict) else None
    if not isinstance(environment, dict):
        raise RuntimeError("Session environment is invalid")
    return environment


def require_developer_user(launcher: str) -> None:
    developer = pwd.getpwnam("developer")
    if os.geteuid() != developer.pw_uid:
        raise RuntimeError(f"{launcher} must run as the developer user")


def launch_shell() -> None:
    require_developer_user("developer-shell")
    environment = load_session_environment()
    os.chdir(WORKSPACE)
    os.umask(0o027)
    os.execve("/bin/bash", ["/bin/bash", "--login"], environment)


def download_checkpoint(session: Session) -> Path | None:
    if not session.checkpoint_download_url:
        return None
    target = checkpoint_target(session.checkpoint_download_url, session.aws_region)
    connection = https_connection(target)
    try:
        connection.request("GET", target[2])
        response = connection.getresponse()
        if response.status == 404:
            response.read()
            return None
        if response.status != 200:
            response.read(64 * 1024)
            raise RuntimeError(
                f"Checkpoint download failed with HTTP {response.status}"
            )
        descriptor, name = tempfile.mkstemp(
            prefix="checkpoint-download-", suffix=".tar.gz", dir=STATE_DIRECTORY
        )
        try:
            with os.fdopen(descriptor, "wb") as destination:
                received = 0
                while chunk := response.read(1024 * 1024):
                    received += len(chunk)
                    if received > MAX_CHECKPOINT_BYTES:
                        raise RuntimeError("Checkpoint exceeds the size limit")
                    destination.write(chunk)
            return Path(name)
        except Exception:
            Path(name).unlink(missing_ok=True)
            raise
    finally:
        connection.close()


def upload_checkpoint(session: Session, archive: Path) -> None:
    size = archive.stat().st_size
    if size > MAX_CHECKPOINT_BYTES:
        raise RuntimeError(f"Compressed checkpoint is {size} bytes; limit exceeded")
    target = checkpoint_target(session.checkpoint_upload_url, session.aws_region)
    connection = https_connection(target)
    try:
        connection.putrequest("PUT", target[2])
        connection.putheader("Content-Type", "application/gzip")
        connection.putheader("Content-Length", str(size))
        connection.endheaders()
        with archive.open("rb") as source:
            while chunk := source.read(1024 * 1024):
                connection.send(chunk)
        response = connection.getresponse()
        response.read(64 * 1024)
        if response.status != 200:
            raise RuntimeError(f"Checkpoint upload failed with HTTP {response.status}")
    finally:
        connection.close()


def checkpoint_target(value: str, region: str) -> tuple[str, int, str]:
    parsed = urlsplit(value)
    hostname = parsed.hostname or ""
    query = parse_qs(parsed.query)
    expected_suffix = f".s3.{region}.amazonaws.com"
    if (
        parsed.scheme != "https"
        or not hostname
        or (
            hostname != f"s3.{region}.amazonaws.com"
            and not hostname.endswith(expected_suffix)
        )
        or "X-Amz-Signature" not in query
    ):
        raise ValueError("Checkpoint URL is not an approved S3 URL")
    return hostname, parsed.port or 443, f"{parsed.path}?{parsed.query}"


def https_connection(target: tuple[str, int, str]) -> http.client.HTTPSConnection:
    return http.client.HTTPSConnection(
        target[0],
        target[1],
        timeout=CHECKPOINT_TIMEOUT_SECONDS,
        context=ssl.create_default_context(),
    )


def atomic_json_write(
    path: Path, value: dict[str, Any], *, mode: int, owner: int, group: int
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as destination:
            json.dump(value, destination, separators=(",", ":"), sort_keys=True)
            destination.write("\n")
        os.chmod(temporary, mode)
        os.chown(temporary, owner, group)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def reset_workspace() -> None:
    staging = Path(tempfile.mkdtemp(prefix="workspace-empty-", dir=STATE_DIRECTORY))
    install_workspace(staging)


def restore_workspace(archive: Path) -> None:
    staging = Path(tempfile.mkdtemp(prefix="workspace-restore-", dir=STATE_DIRECTORY))
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
    home = WORKSPACE / ".home"
    home.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chown(home, developer.pw_uid, developer.pw_gid)


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
                    raise ValueError("Checkpoint expands beyond the configured limit")
                regular_members.append((member, target))
            elif member.issym():
                validate_symlink(relative, member.linkname)
                symlink_members.append((member, target))
            else:
                raise ValueError(f"Unsupported checkpoint member: {member.name}")

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
    return Path(*parts)


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
        prefix="checkpoint-upload-", suffix=".tar.gz", dir=STATE_DIRECTORY
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
                raise RuntimeError("Workspace exceeds the checkpoint limit")
            return member
        if member.isdir():
            return member
        if member.issym():
            relative = safe_member_path(member.name)
            validate_symlink(relative, member.linkname)
            return member
        return None

    try:
        with tarfile.open(
            archive, mode="w:gz", compresslevel=6, dereference=False
        ) as destination:
            for child in sorted(WORKSPACE.iterdir(), key=lambda item: item.name):
                destination.add(
                    child, arcname=child.name, recursive=True, filter=archive_filter
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
    for directory, directories, files in os.walk(root, topdown=True, followlinks=False):
        for name in directories + files:
            path = Path(directory) / name
            os.chown(path, user.pw_uid, user.pw_gid, follow_symlinks=False)


class HookHandler(BaseHTTPRequestHandler):
    server_version = "claude-agentcore-agent"
    sys_version = ""

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/ping":
            self._json_response(200, {"status": "Healthy"})
            return
        self._json_response(404, {"message": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/invocations":
            self._json_response(404, {"message": "Not found"})
            return
        try:
            body = self._read_json_body()
            command = body.get("command")
            if command == "bootstrap":
                result = RUNTIME.bootstrap(body.get("payload", ""))
            elif command in ("suspend", "terminate"):
                result = RUNTIME.checkpoint(command)
            else:
                self._json_response(400, {"message": "Unknown command"})
                return
            self._json_response(200, {"response": result, "status": "success"})
        except (ValueError, TypeError, KeyError) as error:
            LOG.warning("invalid invocation request: %s", error)
            self._json_response(400, {"message": "Invalid request"})
        except Exception:
            LOG.exception("invocation failed")
            self._json_response(500, {"message": "Invocation failed"})

    def log_message(self, format_string: str, *args: object) -> None:
        LOG.info("hook http: " + format_string, *args)

    def _read_json_body(self) -> dict[str, Any]:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError as error:
            raise ValueError("Invalid Content-Length") from error
        if length < 0 or length > MAX_RUN_HOOK_PAYLOAD_BYTES * 4:
            raise ValueError("Request body is too large")
        encoded = self.rfile.read(length)
        if not encoded:
            return {}
        value = json.loads(encoded)
        if not isinstance(value, dict):
            raise ValueError("Request body must be an object")
        return value

    def _json_response(self, status: int, value: dict[str, Any]) -> None:
        encoded = json.dumps(value, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


class HookServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def serve_hooks() -> None:
    STATE_DIRECTORY.mkdir(parents=True, exist_ok=True, mode=0o700)
    server = HookServer(("0.0.0.0", 8080), HookHandler)
    LOG.info("AgentCore Runtime HTTP contract server listening on port 8080")
    server.serve_forever(poll_interval=0.5)


logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


if __name__ == "__main__":
    launcher = Path(sys.argv[0]).name
    if launcher == "developer-shell" or sys.argv[1:] == ["--shell"]:
        launch_shell()
    else:
        serve_hooks()
