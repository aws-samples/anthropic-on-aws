#!/usr/bin/python3.12
"""Supervised VS Code Remote Tunnel runtime and developer login helper."""

from __future__ import annotations

import argparse
import json
import logging
import os
import pwd
import re
import shutil
import signal
import subprocess
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

LOG = logging.getLogger("claude-microvm-vscode")

CODE_BINARY = Path("/usr/local/bin/code")
WORKSPACE = Path("/workspace")
LINUX_HOME = Path("/home/developer")
CLI_DATA_DIRECTORY = LINUX_HOME / ".vscode-cli"
SERVER_DATA_DIRECTORY = LINUX_HOME / ".vscode-server"
EXTENSIONS_DIRECTORY = LINUX_HOME / ".vscode-extensions"
PERSISTED_VSCODE_DIRECTORY = WORKSPACE / ".vscode-state"
MACHINE_SETTINGS_DIRECTORY = PERSISTED_VSCODE_DIRECTORY / "Machine"
SESSION_CONFIGURATION = Path("/var/lib/claude-microvm/session.json")
TUNNEL_STATUS_FILE = Path("/var/lib/claude-microvm/vscode-tunnel-status.json")
TUNNEL_ENABLED_FILE = CLI_DATA_DIRECTORY / "enabled.json"
TUNNEL_TOKEN_FILE = CLI_DATA_DIRECTORY / "token.json"

CLAUDE_EXTENSION = "anthropic.claude-code@2.1.215"
TUNNEL_NAME_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,20}$")
PROVIDERS = ("microsoft", "github")
MONITOR_INTERVAL_SECONDS = 1.0
STARTUP_GRACE_SECONDS = 3.0
TUNNEL_CONNECT_TIMEOUT_SECONDS = 120.0
TUNNEL_STATUS_TIMEOUT_SECONDS = 5.0
MAX_RESTART_DELAY_SECONDS = 30.0
PROCESS_STOP_TIMEOUT_SECONDS = 3.0
IDENTITY_CLEANUP_TIMEOUT_SECONDS = 10.0
HELPER_READY_TIMEOUT_SECONDS = 120.0


@dataclass(frozen=True)
class TunnelConfiguration:
    enabled: bool
    tunnel_name: str | None
    environment: dict[str, str]


@dataclass(frozen=True)
class TunnelPaths:
    code_binary: Path = CODE_BINARY
    workspace: Path = WORKSPACE
    linux_home: Path = LINUX_HOME
    cli_data_directory: Path = CLI_DATA_DIRECTORY
    server_data_directory: Path = SERVER_DATA_DIRECTORY
    extensions_directory: Path = EXTENSIONS_DIRECTORY
    machine_settings_directory: Path = MACHINE_SETTINGS_DIRECTORY
    session_configuration: Path = SESSION_CONFIGURATION
    status_file: Path = TUNNEL_STATUS_FILE
    enabled_file: Path = TUNNEL_ENABLED_FILE
    token_file: Path = TUNNEL_TOKEN_FILE


def load_tunnel_configuration(
    path: Path = SESSION_CONFIGURATION,
) -> TunnelConfiguration:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Session configuration is unavailable") from error
    environment = value.get("environment") if isinstance(value, dict) else None
    vscode = value.get("vscode") if isinstance(value, dict) else None
    if not isinstance(environment, dict) or not all(
        isinstance(key, str) and isinstance(item, str)
        for key, item in environment.items()
    ):
        raise RuntimeError("Session environment is invalid")
    if not isinstance(vscode, dict):
        return TunnelConfiguration(False, None, environment)
    enabled = vscode.get("enabled")
    tunnel_name = vscode.get("tunnelName")
    if not isinstance(enabled, bool):
        raise RuntimeError("VS Code session configuration is invalid")
    if enabled and (
        not isinstance(tunnel_name, str)
        or not TUNNEL_NAME_PATTERN.fullmatch(tunnel_name)
    ):
        raise RuntimeError("VS Code tunnel name is invalid")
    return TunnelConfiguration(
        enabled=enabled,
        tunnel_name=tunnel_name if isinstance(tunnel_name, str) else None,
        environment=environment,
    )


def tunnel_environment(
    environment: dict[str, str],
    paths: TunnelPaths = TunnelPaths(),
) -> dict[str, str]:
    return {
        **environment,
        "HOME": str(paths.linux_home),
        "VSCODE_AGENT_FOLDER": str(paths.server_data_directory),
        "VSCODE_CLI_DATA_DIR": str(paths.cli_data_directory),
        # Lambda MicroVMs do not provide a desktop keyring. Force the CLI's
        # documented file fallback into the ephemeral developer home.
        "VSCODE_CLI_USE_FILE_KEYCHAIN": "1",
    }


def tunnel_command(
    tunnel_name: str,
    paths: TunnelPaths = TunnelPaths(),
) -> list[str]:
    if not TUNNEL_NAME_PATTERN.fullmatch(tunnel_name):
        raise ValueError("Invalid VS Code tunnel name")
    return [
        str(paths.code_binary),
        "--cli-data-dir",
        str(paths.cli_data_directory),
        "--disable-telemetry",
        "tunnel",
        "--accept-server-license-terms",
        "--name",
        tunnel_name,
        "--server-data-dir",
        str(paths.server_data_directory),
        "--extensions-dir",
        str(paths.extensions_directory),
        "--install-extension",
        CLAUDE_EXTENSION,
    ]


def initialize_vscode_storage(
    *,
    inference_mode: str,
    paths: TunnelPaths = TunnelPaths(),
) -> None:
    developer = pwd.getpwnam("developer")
    for directory in (
        paths.linux_home,
        paths.cli_data_directory,
        paths.server_data_directory,
        paths.extensions_directory,
        paths.machine_settings_directory,
    ):
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(directory, 0o700)
        os.chown(directory, developer.pw_uid, developer.pw_gid)

    settings_file = paths.machine_settings_directory / "settings.json"
    settings: dict[str, Any] = {}
    if settings_file.exists():
        if settings_file.is_symlink():
            raise RuntimeError("VS Code machine settings cannot be a symlink")
        try:
            value = json.loads(settings_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise RuntimeError("VS Code machine settings are invalid") from error
        if not isinstance(value, dict):
            raise RuntimeError("VS Code machine settings must be an object")
        settings = value
    settings.update(
        {
            "claudeCode.disableLoginPrompt": inference_mode != "claude-ai",
            "extensions.autoUpdate": False,
            "remote.autoForwardPorts": False,
            "telemetry.telemetryLevel": "off",
        }
    )
    atomic_json_write(
        settings_file,
        settings,
        mode=0o600,
        owner=developer.pw_uid,
        group=developer.pw_gid,
    )

    server_machine = paths.server_data_directory / "data" / "Machine"
    server_machine.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chown(
        server_machine.parent,
        developer.pw_uid,
        developer.pw_gid,
    )
    if server_machine.is_symlink():
        if server_machine.resolve() != paths.machine_settings_directory.resolve():
            raise RuntimeError("VS Code machine settings link is invalid")
    elif server_machine.exists():
        if not server_machine.is_dir() or any(server_machine.iterdir()):
            raise RuntimeError("VS Code machine settings path is not empty")
        server_machine.rmdir()
        server_machine.symlink_to(
            paths.machine_settings_directory,
            target_is_directory=True,
        )
    else:
        server_machine.symlink_to(
            paths.machine_settings_directory,
            target_is_directory=True,
        )
    os.lchown(server_machine, developer.pw_uid, developer.pw_gid)


class TunnelSupervisor:
    """Owns the tunnel process across run, suspend, resume, and terminate."""

    def __init__(
        self,
        *,
        paths: TunnelPaths = TunnelPaths(),
        popen: Any = subprocess.Popen,
        runner: Any = subprocess.run,
        monotonic: Any = time.monotonic,
    ) -> None:
        self._paths = paths
        self._popen = popen
        self._runner = runner
        self._monotonic = monotonic
        self._lock = threading.RLock()
        self._wake = threading.Event()
        self._shutdown = threading.Event()
        self._thread: threading.Thread | None = None
        self._child: subprocess.Popen[bytes] | None = None
        self._child_started_at = 0.0
        self._tunnel_connected = False
        self._next_start_at = 0.0
        self._restart_delay = 1.0
        self._desired = False
        self._enabled = False
        self._tunnel_name: str | None = None
        self._environment: dict[str, str] | None = None
        self._last_status: tuple[str, str | None] | None = None

    def configure(
        self,
        configuration: TunnelConfiguration,
    ) -> None:
        with self._lock:
            self._enabled = configuration.enabled
            self._tunnel_name = configuration.tunnel_name
            self._environment = tunnel_environment(
                configuration.environment,
                self._paths,
            )
            self._desired = configuration.enabled
            self._shutdown.clear()
            self._write_status_locked(
                "waiting-for-login" if configuration.enabled else "disabled"
            )
            if configuration.enabled and (
                self._thread is None or not self._thread.is_alive()
            ):
                self._thread = threading.Thread(
                    target=self._monitor,
                    name="vscode-tunnel-supervisor",
                    daemon=True,
                )
                self._thread.start()
        self._wake.set()

    def pause(self) -> None:
        with self._lock:
            if not self._enabled and self._thread is None:
                return
            self._desired = False
            self._tunnel_connected = False
        self._wake.set()
        self._stop_child()
        with self._lock:
            self._write_status_locked(
                "suspended" if self._enabled else "disabled"
            )

    def resume(self) -> None:
        with self._lock:
            if not self._enabled and self._thread is None:
                return
            self._desired = self._enabled
            self._tunnel_connected = False
            self._next_start_at = 0.0
            self._write_status_locked(
                "waiting-for-login" if self._enabled else "disabled"
            )
        self._wake.set()

    def terminate(self, *, cleanup_identity: bool) -> None:
        with self._lock:
            if not self._enabled and self._thread is None:
                return
            self._desired = False
            self._tunnel_connected = False
        self._wake.set()
        self._stop_child()
        with self._lock:
            self._write_status_locked(
                "terminating" if self._enabled else "disabled"
            )
        if cleanup_identity and self._enabled:
            self._cleanup_identity()

    def close(self) -> None:
        with self._lock:
            self._desired = False
        self._shutdown.set()
        self._wake.set()
        self._stop_child()
        thread = self._thread
        if thread and thread is not threading.current_thread():
            thread.join(timeout=PROCESS_STOP_TIMEOUT_SECONDS)

    def reconcile_once(self) -> None:
        with self._lock:
            child = self._child
            desired = self._desired
            configured = (
                self._enabled
                and self._tunnel_name is not None
                and self._environment is not None
            )
            now = self._monotonic()
            credentials_ready = (
                self._paths.enabled_file.is_file()
                and self._paths.token_file.is_file()
            )

            if child is not None:
                if not desired or not credentials_ready:
                    self._stop_child()
                    self._write_status_locked(
                        "waiting-for-login"
                        if desired
                        else "suspended"
                    )
                    return
                return_code = child.poll()
                if return_code is None:
                    elapsed = now - self._child_started_at
                    if (
                        not self._tunnel_connected
                        and elapsed >= STARTUP_GRACE_SECONDS
                        and tunnel_is_connected(
                            self._tunnel_name,
                            self._environment,
                            self._paths,
                            runner=self._runner,
                        )
                    ):
                        self._tunnel_connected = True
                        self._restart_delay = 1.0
                        self._write_status_locked("running")
                    elif (
                        not self._tunnel_connected
                        and elapsed >= TUNNEL_CONNECT_TIMEOUT_SECONDS
                    ):
                        LOG.warning(
                            "VS Code tunnel did not connect within %.0f seconds",
                            TUNNEL_CONNECT_TIMEOUT_SECONDS,
                        )
                        self._stop_child()
                        self._next_start_at = now + self._restart_delay
                        self._restart_delay = min(
                            self._restart_delay * 2,
                            MAX_RESTART_DELAY_SECONDS,
                        )
                        self._write_status_locked(
                            "retrying",
                            "tunnel relay registration timed out",
                        )
                    return
                self._child = None
                self._tunnel_connected = False
                self._next_start_at = now + self._restart_delay
                self._restart_delay = min(
                    self._restart_delay * 2,
                    MAX_RESTART_DELAY_SECONDS,
                )
                LOG.warning(
                    "VS Code tunnel exited with status %s; retrying",
                    return_code,
                )
                self._write_status_locked(
                    "retrying",
                    f"process exited with status {return_code}",
                )

            if not configured:
                self._write_status_locked("disabled")
                return
            if not desired:
                return
            if not credentials_ready:
                self._write_status_locked("waiting-for-login")
                return
            if now < self._next_start_at:
                return
            self._start_child_locked(now)

    def _monitor(self) -> None:
        while not self._shutdown.is_set():
            try:
                self.reconcile_once()
            except Exception as error:
                LOG.exception("VS Code tunnel reconciliation failed")
                with self._lock:
                    self._write_status_locked("failed", str(error)[:300])
                    self._next_start_at = (
                        self._monotonic() + MAX_RESTART_DELAY_SECONDS
                    )
            self._wake.wait(MONITOR_INTERVAL_SECONDS)
            self._wake.clear()

    def _start_child_locked(self, now: float) -> None:
        if self._tunnel_name is None or self._environment is None:
            return
        developer = pwd.getpwnam("developer")
        self._paths.server_data_directory.mkdir(
            parents=True, exist_ok=True, mode=0o700
        )
        self._paths.extensions_directory.mkdir(
            parents=True, exist_ok=True, mode=0o700
        )
        self._child = self._popen(
            tunnel_command(self._tunnel_name, self._paths),
            stdin=subprocess.DEVNULL,
            cwd=self._paths.workspace,
            env=self._environment,
            user=developer.pw_uid,
            group=developer.pw_gid,
            extra_groups=[developer.pw_gid],
            start_new_session=True,
        )
        self._child_started_at = now
        self._tunnel_connected = False
        self._write_status_locked("starting")
        LOG.info(
            "VS Code tunnel process started",
            extra={
                "tunnel_name": self._tunnel_name,
                "pid": self._child.pid,
            },
        )

    def _stop_child(self) -> None:
        with self._lock:
            child = self._child
            self._child = None
        if child is None or child.poll() is not None:
            return
        try:
            os.killpg(child.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            child.wait(timeout=PROCESS_STOP_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                return
            child.wait(timeout=PROCESS_STOP_TIMEOUT_SECONDS)

    def _cleanup_identity(self) -> None:
        environment = self._environment
        if environment is None:
            return
        self._paths.enabled_file.unlink(missing_ok=True)
        developer = pwd.getpwnam("developer")
        prefix = [
            str(self._paths.code_binary),
            "--cli-data-dir",
            str(self._paths.cli_data_directory),
            "--disable-telemetry",
            "tunnel",
        ]
        for suffix in (["unregister"], ["user", "logout"]):
            try:
                self._runner(
                    [*prefix, *suffix],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    cwd=self._paths.workspace,
                    env=environment,
                    user=developer.pw_uid,
                    group=developer.pw_gid,
                    extra_groups=[developer.pw_gid],
                    timeout=IDENTITY_CLEANUP_TIMEOUT_SECONDS,
                    check=False,
                )
            except (OSError, subprocess.TimeoutExpired) as error:
                LOG.warning("VS Code tunnel identity cleanup failed: %s", error)
        self._paths.token_file.unlink(missing_ok=True)

    def _write_status_locked(
        self,
        state: str,
        detail: str | None = None,
    ) -> None:
        status = (state, detail)
        if status == self._last_status:
            return
        self._last_status = status
        developer = pwd.getpwnam("developer")
        atomic_json_write(
            self._paths.status_file,
            {
                "detail": detail,
                "state": state,
                "tunnelName": self._tunnel_name,
                "updatedAt": int(time.time()),
            },
            mode=0o640,
            owner=0,
            group=developer.pw_gid,
        )


def atomic_json_write(
    path: Path,
    value: dict[str, Any],
    *,
    mode: int,
    owner: int,
    group: int,
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


def helper_main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="vscode-tunnel",
        description="Authenticate and control this MicroVM's VS Code tunnel.",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    login = subcommands.add_parser("login")
    login.add_argument(
        "--provider",
        choices=PROVIDERS,
        default="microsoft",
    )
    login.add_argument(
        "--force",
        action="store_true",
        help="Replace any existing tunnel identity before login.",
    )
    subcommands.add_parser("status")
    subcommands.add_parser("disable")
    subcommands.add_parser("logout")
    arguments = parser.parse_args(argv)

    configuration = load_tunnel_configuration()
    if not configuration.enabled or not configuration.tunnel_name:
        raise RuntimeError(
            "This MicroVM was not launched as a VS Code session"
        )
    paths = TunnelPaths()
    environment = tunnel_environment(configuration.environment, paths)

    if arguments.command == "status":
        print_status(configuration.tunnel_name, paths)
        return 0
    if arguments.command in ("disable", "logout"):
        paths.enabled_file.unlink(missing_ok=True)
        wait_for_tunnel_state({"suspended", "terminating", "waiting-for-login"}, 10)
        if arguments.command == "logout":
            run_developer_cli(["tunnel", "unregister"], environment, paths)
            run_developer_cli(["tunnel", "user", "logout"], environment, paths)
        print(f"VS Code tunnel {configuration.tunnel_name} is disabled.")
        return 0

    show = run_developer_cli(
        ["tunnel", "user", "show"],
        environment,
        paths,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if arguments.force:
        reset_tunnel_identity(environment, paths)
    if show.returncode != 0 or arguments.force:
        login_result = run_developer_cli(
            [
                "tunnel",
                "user",
                "login",
                "--provider",
                arguments.provider,
            ],
            environment,
            paths,
        )
        if login_result.returncode != 0:
            return login_result.returncode

    current_user = pwd.getpwuid(os.geteuid())
    atomic_json_write(
        paths.enabled_file,
        {
            "provider": arguments.provider,
            "tunnelName": configuration.tunnel_name,
        },
        mode=0o600,
        owner=current_user.pw_uid,
        group=current_user.pw_gid,
    )
    print(f"Starting VS Code tunnel {configuration.tunnel_name}...")
    state = wait_for_tunnel_state(
        {"running", "failed"},
        HELPER_READY_TIMEOUT_SECONDS,
    )
    if state == "running":
        print(f"VS Code tunnel {configuration.tunnel_name} is ready.")
        return 0
    if state == "failed":
        print_status(configuration.tunnel_name, paths)
        return 1
    print(
        "Tunnel startup is still in progress. The local VS Code client can "
        "retry the connection."
    )
    return 0


def reset_tunnel_identity(
    environment: dict[str, str],
    paths: TunnelPaths,
) -> None:
    paths.enabled_file.unlink(missing_ok=True)
    wait_for_tunnel_state(
        {"suspended", "terminating", "waiting-for-login"},
        10,
        status_file=paths.status_file,
    )
    for arguments in (
        ["tunnel", "unregister"],
        ["tunnel", "user", "logout"],
    ):
        try:
            run_developer_cli(
                arguments,
                environment,
                paths,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=IDENTITY_CLEANUP_TIMEOUT_SECONDS,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            LOG.warning(
                "VS Code tunnel identity reset failed: %s",
                error,
            )
    paths.token_file.unlink(missing_ok=True)


def run_developer_cli(
    arguments: list[str],
    environment: dict[str, str],
    paths: TunnelPaths,
    *,
    stdout: Any = None,
    stderr: Any = None,
    timeout: float | None = None,
) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        [
            str(paths.code_binary),
            "--cli-data-dir",
            str(paths.cli_data_directory),
            "--disable-telemetry",
            *arguments,
        ],
        stdin=None,
        stdout=stdout,
        stderr=stderr,
        cwd=paths.workspace,
        env=environment,
        timeout=timeout,
        check=False,
    )


def tunnel_is_connected(
    tunnel_name: str | None,
    environment: dict[str, str] | None,
    paths: TunnelPaths = TunnelPaths(),
    *,
    runner: Any = subprocess.run,
) -> bool:
    if (
        tunnel_name is None
        or environment is None
        or not TUNNEL_NAME_PATTERN.fullmatch(tunnel_name)
    ):
        return False
    developer = pwd.getpwnam("developer")
    try:
        result = runner(
            [
                str(paths.code_binary),
                "--cli-data-dir",
                str(paths.cli_data_directory),
                "--disable-telemetry",
                "tunnel",
                "status",
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=paths.workspace,
            env=environment,
            user=developer.pw_uid,
            group=developer.pw_gid,
            extra_groups=[developer.pw_gid],
            timeout=TUNNEL_STATUS_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    if result.returncode != 0:
        return False
    try:
        value = json.loads(result.stdout)
    except (TypeError, UnicodeDecodeError, json.JSONDecodeError):
        return False
    tunnel = value.get("tunnel") if isinstance(value, dict) else None
    return (
        isinstance(tunnel, dict)
        and tunnel.get("name") == tunnel_name
        and tunnel.get("tunnel") == "Connected"
        and tunnel.get("last_fail_reason") is None
    )


def wait_for_tunnel_state(
    expected: set[str],
    timeout_seconds: float,
    *,
    status_file: Path = TUNNEL_STATUS_FILE,
) -> str | None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        state = read_tunnel_state(status_file)
        if state in expected:
            return state
        time.sleep(0.5)
    return None


def read_tunnel_state(status_file: Path = TUNNEL_STATUS_FILE) -> str | None:
    try:
        value = json.loads(status_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    state = value.get("state") if isinstance(value, dict) else None
    return state if isinstance(state, str) else None


def print_status(tunnel_name: str, paths: TunnelPaths) -> None:
    try:
        value = json.loads(paths.status_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        value = {"state": "unknown", "tunnelName": tunnel_name}
    print(json.dumps(value, indent=2, sort_keys=True))


if __name__ == "__main__":
    try:
        raise SystemExit(helper_main())
    except (RuntimeError, ValueError) as error:
        print(f"vscode-tunnel: {error}", file=os.sys.stderr)
        raise SystemExit(1) from error
