from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from microvm import agent


def session() -> agent.Session:
    return agent.Session(
        session_id="session-1",
        owner_hash="a" * 64,
        workspace_id="default",
        aws_region="us-east-1",
        inference_mode="claude-gateway",
        claude_gateway_url="https://claude.internal.example.com",
        bedrock_model_id=None,
        agentcore_gateway_url=None,
        checkpoint_download_url=None,
        checkpoint_upload_url=(
            "https://workspace.s3.us-east-1.amazonaws.com/upload"
            "?X-Amz-Signature=signature"
            "&X-Amz-Credential=credential"
        ),
        microvm_id="microvm-1",
    )


class TerminalConfigurationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.home = self.root / "home"
        self.settings = self.home / ".claude" / "settings.json"
        self.marker = self.home / ".terminal-defaults.json"
        self.developer = SimpleNamespace(pw_uid=1000, pw_gid=1000)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def patches(self) -> tuple[object, ...]:
        return (
            mock.patch.object(agent, "DEVELOPER_HOME", self.home),
            mock.patch.object(agent, "CLAUDE_SETTINGS", self.settings),
            mock.patch.object(
                agent,
                "TERMINAL_DEFAULTS_MARKER",
                self.marker,
            ),
            mock.patch.object(
                agent.pwd,
                "getpwnam",
                return_value=self.developer,
            ),
            mock.patch.object(agent.os, "chown"),
        )

    def test_seeds_ansi_flicker_free_defaults(self) -> None:
        patches = self.patches()
        with patches[0], patches[1], patches[2], patches[3], patches[4]:
            agent.write_terminal_defaults()

        self.assertEqual(
            json.loads(self.settings.read_text(encoding="utf-8")),
            {
                "prefersReducedMotion": True,
                "theme": "dark-ansi",
                "tui": "fullscreen",
            },
        )
        self.assertEqual(
            json.loads(self.marker.read_text(encoding="utf-8")),
            {"version": 1},
        )

    def test_migrates_dark_once_then_preserves_user_choice(self) -> None:
        self.settings.parent.mkdir(parents=True)
        self.settings.write_text(
            json.dumps({"theme": "dark", "custom": "kept"}),
            encoding="utf-8",
        )
        patches = self.patches()
        with patches[0], patches[1], patches[2], patches[3], patches[4]:
            agent.write_terminal_defaults()

            migrated = json.loads(self.settings.read_text(encoding="utf-8"))
            self.assertEqual(migrated["theme"], "dark-ansi")
            self.assertEqual(migrated["custom"], "kept")

            migrated["theme"] = "light-ansi"
            self.settings.write_text(json.dumps(migrated), encoding="utf-8")
            agent.write_terminal_defaults()

        self.assertEqual(
            json.loads(self.settings.read_text(encoding="utf-8"))["theme"],
            "light-ansi",
        )

    def test_preserves_explicit_terminal_preferences(self) -> None:
        expected = {
            "theme": "light-ansi",
            "tui": "default",
            "prefersReducedMotion": False,
        }
        self.settings.parent.mkdir(parents=True)
        self.settings.write_text(json.dumps(expected), encoding="utf-8")
        patches = self.patches()
        with patches[0], patches[1], patches[2], patches[3], patches[4]:
            agent.write_terminal_defaults()

        self.assertEqual(
            json.loads(self.settings.read_text(encoding="utf-8")),
            expected,
        )

    def test_does_not_overwrite_invalid_user_settings(self) -> None:
        self.settings.parent.mkdir(parents=True)
        self.settings.write_text("{invalid", encoding="utf-8")
        patches = self.patches()
        with patches[0], patches[1], patches[2], patches[3], patches[4]:
            agent.write_terminal_defaults()

        self.assertEqual(
            self.settings.read_text(encoding="utf-8"),
            "{invalid",
        )
        self.assertFalse(self.marker.exists())

    def test_session_environment_does_not_claim_truecolor(self) -> None:
        state = self.root / "state"
        configuration = state / "session.json"
        with (
            mock.patch.object(agent, "STATE_DIRECTORY", state),
            mock.patch.object(agent, "SESSION_CONFIGURATION", configuration),
            mock.patch.object(
                agent.pwd,
                "getpwnam",
                return_value=self.developer,
            ),
            mock.patch.object(agent.os, "chown"),
        ):
            agent.write_session_configuration(session())

        environment = json.loads(
            configuration.read_text(encoding="utf-8")
        )["environment"]
        self.assertEqual(environment["TERM"], "xterm-256color")
        self.assertNotIn("COLORTERM", environment)
        self.assertEqual(environment["HOME"], str(agent.LINUX_HOME))
        self.assertEqual(
            environment["CLAUDE_CONFIG_DIR"],
            str(agent.CLAUDE_CONFIG_DIRECTORY),
        )
        self.assertEqual(
            environment["GIT_CONFIG_GLOBAL"],
            str(agent.DEVELOPER_STATE_DIRECTORY / "gitconfig"),
        )
        self.assertEqual(
            environment["ANTHROPIC_BASE_URL"],
            "https://claude.internal.example.com",
        )
        self.assertNotIn("CLAUDE_CODE_USE_BEDROCK", environment)

    def test_provider_environments_are_mutually_exclusive(self) -> None:
        bedrock = session()
        bedrock = agent.Session(
            **{
                **bedrock.__dict__,
                "inference_mode": "bedrock",
                "claude_gateway_url": None,
                "bedrock_model_id": (
                    "us.anthropic.claude-sonnet-4-6"
                ),
            }
        )
        direct = agent.Session(
            **{
                **bedrock.__dict__,
                "inference_mode": "claude-ai",
                "bedrock_model_id": None,
            }
        )

        bedrock_environment = agent.claude_provider_environment(
            bedrock
        )
        direct_environment = agent.claude_provider_environment(direct)

        self.assertEqual(
            bedrock_environment,
            {
                "ANTHROPIC_MODEL": (
                    "us.anthropic.claude-sonnet-4-6"
                ),
                "CLAUDE_CODE_USE_BEDROCK": "1",
            },
        )
        self.assertEqual(direct_environment, {})
        self.assertNotIn("ANTHROPIC_BASE_URL", bedrock_environment)


if __name__ == "__main__":
    unittest.main()
