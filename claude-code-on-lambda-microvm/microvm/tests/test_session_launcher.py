from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from microvm import agent


class FakeProcess:
    def __init__(self, returncode: int | None = None) -> None:
        self.returncode = returncode
        self.terminate_calls = 0
        self.kill_calls = 0

    def poll(self) -> int | None:
        return self.returncode

    def terminate(self) -> None:
        self.terminate_calls += 1
        self.returncode = 0

    def kill(self) -> None:
        self.kill_calls += 1
        self.returncode = -9

    def wait(self, timeout: float | None = None) -> int:
        del timeout
        if self.returncode is None:
            raise AssertionError("process is still running")
        return self.returncode


class SessionLauncherTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.workspace = self.root / "workspace"
        self.workspace.mkdir()
        self.configuration = self.root / "session.json"
        self.binary = self.root / "claude"
        self.binary.touch()
        self.developer = SimpleNamespace(pw_uid=1000)
        self.environment = {
            "HOME": str(self.workspace),
            "ANTHROPIC_BASE_URL": "https://gateway.example.com",
        }
        self.configuration.write_text(
            json.dumps({"environment": self.environment}),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def launcher_patches(self) -> tuple[object, ...]:
        return (
            mock.patch.object(agent, "WORKSPACE", self.workspace),
            mock.patch.object(
                agent,
                "SESSION_CONFIGURATION",
                self.configuration,
            ),
            mock.patch.object(agent, "CLAUDE_BINARY", self.binary),
            mock.patch.object(
                agent.pwd,
                "getpwnam",
                return_value=self.developer,
            ),
            mock.patch.object(agent.os, "geteuid", return_value=1000),
            mock.patch.object(agent.os, "chdir"),
            mock.patch.object(agent.os, "umask"),
            mock.patch.object(agent.os, "execve"),
        )

    def test_cached_gateway_login_executes_claude_directly(self) -> None:
        patches = self.launcher_patches()
        with (
            patches[0],
            patches[1],
            patches[2],
            patches[3],
            patches[4],
            patches[5],
            patches[6],
            patches[7] as execve,
            mock.patch.object(
                agent,
                "claude_is_authenticated",
                return_value=True,
            ),
            mock.patch.object(agent, "complete_gateway_login") as login,
        ):
            agent.launch_claude()

        login.assert_not_called()
        execve.assert_called_once_with(
            str(self.binary),
            [str(self.binary)],
            self.environment,
        )

    def test_first_gateway_login_restarts_into_clean_tui(self) -> None:
        patches = self.launcher_patches()
        with (
            patches[0],
            patches[1],
            patches[2],
            patches[3],
            patches[4],
            patches[5],
            patches[6],
            patches[7] as execve,
            mock.patch.object(
                agent,
                "claude_is_authenticated",
                return_value=False,
            ),
            mock.patch.object(
                agent,
                "complete_gateway_login",
                return_value=True,
            ) as login,
        ):
            agent.launch_claude()

        login.assert_called_once_with(self.environment)
        execve.assert_called_once()

    def test_gateway_login_supervisor_stops_authenticated_tui(self) -> None:
        child = FakeProcess()
        with (
            mock.patch.object(
                agent.subprocess,
                "Popen",
                return_value=child,
            ) as popen,
            mock.patch.object(
                agent,
                "claude_is_authenticated",
                return_value=True,
            ),
            mock.patch.object(agent.signal, "signal", return_value=None),
            mock.patch.object(agent.time, "sleep"),
        ):
            authenticated = agent.complete_gateway_login(self.environment)

        self.assertTrue(authenticated)
        self.assertEqual(child.terminate_calls, 1)
        self.assertEqual(child.kill_calls, 0)
        popen.assert_called_once_with(
            [str(agent.CLAUDE_BINARY)],
            env=self.environment,
        )

    def test_gateway_login_supervisor_preserves_early_exit(self) -> None:
        child = FakeProcess(returncode=0)
        with (
            mock.patch.object(
                agent.subprocess,
                "Popen",
                return_value=child,
            ),
            mock.patch.object(
                agent,
                "claude_is_authenticated",
                return_value=False,
            ),
            mock.patch.object(agent.signal, "signal", return_value=None),
        ):
            authenticated = agent.complete_gateway_login(self.environment)

        self.assertFalse(authenticated)
        self.assertEqual(child.terminate_calls, 0)


if __name__ == "__main__":
    unittest.main()
