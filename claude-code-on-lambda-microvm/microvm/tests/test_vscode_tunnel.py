from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from microvm import vscode_tunnel


class FakeThread:
    def __init__(self, *, target: object, name: str, daemon: bool) -> None:
        del target, name, daemon
        self.started = False
        self.join_calls = 0

    def start(self) -> None:
        self.started = True

    def is_alive(self) -> bool:
        return self.started

    def join(self, timeout: float | None = None) -> None:
        del timeout
        self.join_calls += 1


class FakeChild:
    def __init__(self, pid: int = 321) -> None:
        self.pid = pid
        self.returncode: int | None = None
        self.wait_calls = 0

    def poll(self) -> int | None:
        return self.returncode

    def wait(self, timeout: float | None = None) -> int:
        del timeout
        self.wait_calls += 1
        if self.returncode is None:
            self.returncode = 0
        return self.returncode


class VscodeTunnelTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.paths = vscode_tunnel.TunnelPaths(
            code_binary=self.root / "code",
            workspace=self.root / "workspace",
            linux_home=self.root / "home",
            cli_data_directory=self.root / "home" / ".vscode-cli",
            server_data_directory=self.root / "home" / ".vscode-server",
            extensions_directory=(
                self.root / "home" / ".vscode-extensions"
            ),
            machine_settings_directory=(
                self.root / "workspace" / ".vscode-state" / "Machine"
            ),
            session_configuration=self.root / "session.json",
            status_file=self.root / "status.json",
            enabled_file=(
                self.root / "home" / ".vscode-cli" / "enabled.json"
            ),
            token_file=(
                self.root / "home" / ".vscode-cli" / "token.json"
            ),
        )
        self.paths.code_binary.touch()
        self.paths.workspace.mkdir()
        self.developer = SimpleNamespace(pw_uid=1000, pw_gid=1000)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def identity_patches(self) -> tuple[object, ...]:
        return (
            mock.patch.object(
                vscode_tunnel.pwd,
                "getpwnam",
                return_value=self.developer,
            ),
            mock.patch.object(vscode_tunnel.os, "chown"),
            mock.patch.object(vscode_tunnel.os, "lchown"),
        )

    def test_builds_pinned_tunnel_command_and_environment(self) -> None:
        command = vscode_tunnel.tunnel_command(
            "cm-0123456789abcdef0",
            self.paths,
        )
        environment = vscode_tunnel.tunnel_environment(
            {"AWS_REGION": "us-east-1"},
            self.paths,
        )

        self.assertEqual(command[0], str(self.paths.code_binary))
        self.assertIn("--accept-server-license-terms", command)
        self.assertIn(
            "anthropic.claude-code@2.1.215",
            command,
        )
        self.assertEqual(
            environment["VSCODE_CLI_DATA_DIR"],
            str(self.paths.cli_data_directory),
        )
        self.assertEqual(
            environment["VSCODE_CLI_USE_FILE_KEYCHAIN"],
            "1",
        )

    def test_initializes_persistent_machine_settings_only(self) -> None:
        patches = self.identity_patches()
        with patches[0], patches[1], patches[2]:
            vscode_tunnel.initialize_vscode_storage(
                inference_mode="bedrock",
                paths=self.paths,
            )

        settings_file = (
            self.paths.machine_settings_directory / "settings.json"
        )
        settings = json.loads(settings_file.read_text(encoding="utf-8"))
        self.assertTrue(settings["claudeCode.disableLoginPrompt"])
        self.assertFalse(settings["extensions.autoUpdate"])
        server_machine = (
            self.paths.server_data_directory / "data" / "Machine"
        )
        self.assertTrue(server_machine.is_symlink())
        self.assertEqual(
            server_machine.resolve(),
            self.paths.machine_settings_directory.resolve(),
        )
        self.assertFalse(
            self.paths.cli_data_directory.is_relative_to(
                self.paths.workspace
            )
        )

        settings["custom.setting"] = "preserved"
        settings_file.write_text(json.dumps(settings), encoding="utf-8")
        patches = self.identity_patches()
        with patches[0], patches[1], patches[2]:
            vscode_tunnel.initialize_vscode_storage(
                inference_mode="claude-ai",
                paths=self.paths,
            )
        updated = json.loads(settings_file.read_text(encoding="utf-8"))
        self.assertFalse(updated["claudeCode.disableLoginPrompt"])
        self.assertEqual(updated["custom.setting"], "preserved")

    def test_supervisor_waits_for_login_starts_and_stops_on_disable(
        self,
    ) -> None:
        clock = [10.0]
        child = FakeChild()
        popen = mock.Mock(return_value=child)
        status = mock.Mock(
            return_value=subprocess.CompletedProcess(
                [],
                0,
                stdout=json.dumps(
                    {
                        "tunnel": {
                            "name": "cm-0123456789abcdef0",
                            "tunnel": "Connected",
                            "last_fail_reason": None,
                        }
                    }
                ).encode(),
                stderr=b"",
            )
        )
        supervisor = vscode_tunnel.TunnelSupervisor(
            paths=self.paths,
            popen=popen,
            runner=status,
            monotonic=lambda: clock[0],
        )
        configuration = vscode_tunnel.TunnelConfiguration(
            enabled=True,
            tunnel_name="cm-0123456789abcdef0",
            environment={"AWS_REGION": "us-east-1"},
        )
        patches = self.identity_patches()
        with (
            patches[0],
            patches[1],
            patches[2],
            mock.patch.object(
                vscode_tunnel.threading,
                "Thread",
                FakeThread,
            ),
            mock.patch.object(
                vscode_tunnel.os,
                "killpg",
                side_effect=lambda _pid, _signal: setattr(
                    child, "returncode", 0
                ),
            ) as killpg,
        ):
            supervisor.configure(configuration)
            supervisor.reconcile_once()
            popen.assert_not_called()

            self.paths.enabled_file.parent.mkdir(parents=True)
            self.paths.enabled_file.write_text("{}", encoding="utf-8")
            self.paths.token_file.write_text("token", encoding="utf-8")
            supervisor.reconcile_once()
            popen.assert_called_once()

            clock[0] += 4
            supervisor.reconcile_once()
            self.assertEqual(
                json.loads(
                    self.paths.status_file.read_text(encoding="utf-8")
                )["state"],
                "running",
            )
            status.assert_called_once()

            self.paths.enabled_file.unlink()
            supervisor.reconcile_once()
            killpg.assert_called_once_with(
                child.pid,
                vscode_tunnel.signal.SIGTERM,
            )
            self.assertEqual(
                json.loads(
                    self.paths.status_file.read_text(encoding="utf-8")
                )["state"],
                "waiting-for-login",
            )
            supervisor.close()

        call = popen.call_args
        self.assertEqual(call.kwargs["user"], 1000)
        self.assertEqual(call.kwargs["group"], 1000)
        self.assertTrue(call.kwargs["start_new_session"])

    def test_requires_connected_tunnel_status_before_running(self) -> None:
        clock = [10.0]
        child = FakeChild()
        popen = mock.Mock(return_value=child)
        status = mock.Mock(
            return_value=subprocess.CompletedProcess(
                [],
                0,
                stdout=b'{"tunnel":{"name":"cm-0123456789abcdef0",'
                b'"tunnel":"Disconnected","last_fail_reason":null}}',
                stderr=b"",
            )
        )
        supervisor = vscode_tunnel.TunnelSupervisor(
            paths=self.paths,
            popen=popen,
            runner=status,
            monotonic=lambda: clock[0],
        )
        configuration = vscode_tunnel.TunnelConfiguration(
            enabled=True,
            tunnel_name="cm-0123456789abcdef0",
            environment={"AWS_REGION": "us-east-1"},
        )
        self.paths.enabled_file.parent.mkdir(parents=True)
        self.paths.enabled_file.write_text("{}", encoding="utf-8")
        self.paths.token_file.write_text("token", encoding="utf-8")
        patches = self.identity_patches()
        with (
            patches[0],
            patches[1],
            patches[2],
            mock.patch.object(
                vscode_tunnel.threading,
                "Thread",
                FakeThread,
            ),
            mock.patch.object(vscode_tunnel.os, "killpg"),
        ):
            supervisor.configure(configuration)
            supervisor.reconcile_once()
            clock[0] += 4
            supervisor.reconcile_once()
            self.assertEqual(
                json.loads(
                    self.paths.status_file.read_text(encoding="utf-8")
                )["state"],
                "starting",
            )

            status.return_value = subprocess.CompletedProcess(
                [],
                0,
                stdout=b'{"tunnel":{"name":"cm-0123456789abcdef0",'
                b'"tunnel":"Connected","last_fail_reason":null}}',
                stderr=b"",
            )
            supervisor.reconcile_once()
            self.assertEqual(
                json.loads(
                    self.paths.status_file.read_text(encoding="utf-8")
                )["state"],
                "running",
            )
            supervisor.close()

    def test_parses_only_the_assigned_connected_tunnel(self) -> None:
        runner = mock.Mock(
            return_value=subprocess.CompletedProcess(
                [],
                0,
                stdout=b'{"tunnel":{"name":"cm-0123456789abcdef0",'
                b'"tunnel":"Connected","last_fail_reason":null}}',
                stderr=b"",
            )
        )
        patches = self.identity_patches()
        with patches[0]:
            self.assertTrue(
                vscode_tunnel.tunnel_is_connected(
                    "cm-0123456789abcdef0",
                    {"HOME": str(self.paths.linux_home)},
                    self.paths,
                    runner=runner,
                )
            )
            self.assertFalse(
                vscode_tunnel.tunnel_is_connected(
                    "cm-different",
                    {"HOME": str(self.paths.linux_home)},
                    self.paths,
                    runner=runner,
                )
            )

    def test_termination_unregisters_and_removes_ephemeral_identity(
        self,
    ) -> None:
        self.paths.enabled_file.parent.mkdir(parents=True)
        self.paths.enabled_file.write_text("{}", encoding="utf-8")
        self.paths.token_file.write_text("secret", encoding="utf-8")
        runner = mock.Mock(
            return_value=subprocess.CompletedProcess([], 0)
        )
        supervisor = vscode_tunnel.TunnelSupervisor(
            paths=self.paths,
            runner=runner,
        )
        supervisor._enabled = True
        supervisor._tunnel_name = "cm-0123456789abcdef0"
        supervisor._environment = {}
        patches = self.identity_patches()
        with patches[0], patches[1], patches[2]:
            supervisor.terminate(cleanup_identity=True)

        self.assertFalse(self.paths.enabled_file.exists())
        self.assertFalse(self.paths.token_file.exists())
        self.assertEqual(runner.call_count, 2)
        commands = [call.args[0] for call in runner.call_args_list]
        self.assertIn("unregister", commands[0])
        self.assertEqual(commands[1][-2:], ["user", "logout"])
        for call in runner.call_args_list:
            self.assertEqual(
                call.kwargs["timeout"],
                vscode_tunnel.IDENTITY_CLEANUP_TIMEOUT_SECONDS,
            )
        self.assertEqual(
            vscode_tunnel.IDENTITY_CLEANUP_TIMEOUT_SECONDS,
            10.0,
        )

    def test_forced_login_resets_stale_identity_before_device_flow(
        self,
    ) -> None:
        self.paths.enabled_file.parent.mkdir(parents=True)
        self.paths.enabled_file.write_text("{}", encoding="utf-8")
        self.paths.token_file.write_text("stale", encoding="utf-8")
        with (
            mock.patch.object(
                vscode_tunnel,
                "wait_for_tunnel_state",
            ) as wait,
            mock.patch.object(
                vscode_tunnel,
                "run_developer_cli",
                return_value=subprocess.CompletedProcess([], 0),
            ) as run,
        ):
            vscode_tunnel.reset_tunnel_identity(
                {"HOME": str(self.paths.linux_home)},
                self.paths,
            )

        self.assertFalse(self.paths.enabled_file.exists())
        self.assertFalse(self.paths.token_file.exists())
        self.assertEqual(run.call_count, 2)
        self.assertEqual(
            run.call_args_list[0].args[0],
            ["tunnel", "unregister"],
        )
        self.assertEqual(
            run.call_args_list[1].args[0],
            ["tunnel", "user", "logout"],
        )
        for call in run.call_args_list:
            self.assertEqual(
                call.kwargs["timeout"],
                vscode_tunnel.IDENTITY_CLEANUP_TIMEOUT_SECONDS,
            )
        self.assertEqual(
            wait.call_args.kwargs["status_file"],
            self.paths.status_file,
        )

    def test_loads_only_valid_vscode_session_configuration(self) -> None:
        self.paths.session_configuration.write_text(
            json.dumps(
                {
                    "environment": {"HOME": str(self.paths.linux_home)},
                    "vscode": {
                        "enabled": True,
                        "tunnelName": "cm-0123456789abcdef0",
                    },
                }
            ),
            encoding="utf-8",
        )
        configuration = vscode_tunnel.load_tunnel_configuration(
            self.paths.session_configuration
        )
        self.assertTrue(configuration.enabled)

        self.paths.session_configuration.write_text(
            json.dumps(
                {
                    "environment": {},
                    "vscode": {
                        "enabled": True,
                        "tunnelName": "../invalid",
                    },
                }
            ),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(RuntimeError, "name"):
            vscode_tunnel.load_tunnel_configuration(
                self.paths.session_configuration
            )


if __name__ == "__main__":
    unittest.main()
