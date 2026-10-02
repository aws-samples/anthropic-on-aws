"""Unit tests for the workspace checkpoint logic in agent.py.

Run with: python3 -m unittest discover -s agent-runtime
"""

from __future__ import annotations

import json
import os
import pwd
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import agent


class CheckpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self._directory = tempfile.TemporaryDirectory()
        root = Path(self._directory.name)
        self.workspace = root / "workspace"
        self.workspace.mkdir()
        state = root / "state"
        patches = [
            mock.patch.object(agent, "WORKSPACE", self.workspace),
            mock.patch.object(agent, "STATE_DIRECTORY", state),
            mock.patch.object(agent, "CHECKPOINT_INTERVAL_SECONDS", 0),
        ]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.addCleanup(self._directory.cleanup)
        self.uploads: list[bytes] = []

        def record_upload(_session: agent.Session, archive: Path) -> None:
            self.uploads.append(archive.read_bytes())

        upload = mock.patch.object(agent, "upload_checkpoint", record_upload)
        upload.start()
        self.addCleanup(upload.stop)

        self.runtime = agent.Runtime()
        self.runtime._session = mock.sentinel.session  # noqa: SLF001

    def test_archive_is_deterministic_for_unchanged_workspace(self) -> None:
        (self.workspace / "canary.txt").write_text("hello\n")
        first = agent.create_workspace_archive()
        second = agent.create_workspace_archive()
        try:
            self.assertEqual(first.read_bytes(), second.read_bytes())
        finally:
            first.unlink()
            second.unlink()

    def test_archive_contains_visible_files(self) -> None:
        (self.workspace / "canary.txt").write_text("hello\n")
        (self.workspace / "src").mkdir()
        (self.workspace / "src" / "main.py").write_text("print(1)\n")
        archive = agent.create_workspace_archive()
        try:
            with tarfile.open(archive) as source:
                names = source.getnames()
        finally:
            archive.unlink()
        self.assertIn("canary.txt", names)
        self.assertIn("src/main.py", names)

    def test_checkpoint_skips_upload_only_when_unchanged(self) -> None:
        canary = self.workspace / "canary.txt"
        canary.write_text("one\n")
        self.assertEqual(self.runtime.checkpoint("periodic")["status"], "checkpointed")
        self.assertEqual(self.runtime.checkpoint("periodic")["status"], "unchanged")
        canary.write_text("two, a longer line\n")
        self.assertEqual(self.runtime.checkpoint("suspend")["status"], "checkpointed")
        # Regression: a "checkpoint is current" flag set by the first upload
        # used to make every later checkpoint (here: terminate after a
        # suspend) skip the upload even though files had changed.
        (self.workspace / "after-suspend.txt").write_text("three\n")
        self.assertEqual(
            self.runtime.checkpoint("terminate")["status"], "checkpointed"
        )
        self.assertEqual(len(self.uploads), 3)

    def test_checkpoint_without_session(self) -> None:
        self.runtime._session = None  # noqa: SLF001
        self.assertEqual(
            self.runtime.checkpoint("periodic"), {"status": "no-active-session"}
        )
        self.assertEqual(self.uploads, [])


class GithubMcpServerTest(unittest.TestCase):
    """Covers parse_run_hook_payload's optional githubGatewayUrl/
    userIdToken fields and configure_github_mcp_server's
    $CLAUDE_CONFIG_DIR/.claude.json writes -- the MCP server registration
    path for the optional GitHub gateway sample (see README, "GitHub
    integration setup").
    """

    def setUp(self) -> None:
        self._directory = tempfile.TemporaryDirectory()
        root = Path(self._directory.name)
        self.workspace = root / "workspace"
        self.workspace.mkdir()
        self.developer_home = self.workspace / ".claude-home"
        self.config_json = self.developer_home / ".claude" / ".claude.json"
        current = pwd.getpwuid(os.getuid())
        patches = [
            mock.patch.object(agent, "WORKSPACE", self.workspace),
            mock.patch.object(agent, "DEVELOPER_HOME", self.developer_home),
            mock.patch.object(
                agent, "CLAUDE_SETTINGS", self.developer_home / ".claude" / "settings.json"
            ),
            mock.patch.object(agent, "CLAUDE_CONFIG_JSON", self.config_json),
            # chown-to-self (same uid/gid the test already runs as) is
            # always permitted without root; chown-to-"developer" is not,
            # inside this test environment.
            mock.patch.object(agent.pwd, "getpwnam", return_value=current),
        ]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.addCleanup(self._directory.cleanup)

    def _base_payload(self, **overrides: object) -> dict[str, object]:
        payload: dict[str, object] = {
            "version": 1,
            "sessionId": "s" * 33,
            "ownerHash": "a" * 64,
            "workspaceId": "default",
            "awsRegion": "us-west-2",
            "inferenceMode": "bedrock",
            "bedrockModelId": "anthropic.claude-sonnet-5",
            "checkpoint": {"uploadUrl": "https://example.s3.us-west-2.amazonaws.com/x"},
        }
        payload.update(overrides)
        return payload

    def test_parses_both_fields_when_present(self) -> None:
        session = agent.parse_run_hook_payload(
            json.dumps(
                self._base_payload(
                    githubGatewayUrl="https://gw.example/mcp",
                    userIdToken="header.payload.sig",
                )
            )
        )
        self.assertEqual(session.github_gateway_url, "https://gw.example/mcp")
        self.assertEqual(session.user_id_token, "header.payload.sig")

    def test_omits_both_fields_when_absent(self) -> None:
        session = agent.parse_run_hook_payload(json.dumps(self._base_payload()))
        self.assertIsNone(session.github_gateway_url)
        self.assertIsNone(session.user_id_token)

    def test_drops_a_lone_field_defensively(self) -> None:
        # The control plane never sends just one (see service.ts), but
        # parsing must not half-configure the MCP tool if that invariant
        # is ever violated.
        session = agent.parse_run_hook_payload(
            json.dumps(
                self._base_payload(githubGatewayUrl="https://gw.example/mcp")
            )
        )
        self.assertIsNone(session.github_gateway_url)
        self.assertIsNone(session.user_id_token)

    def test_rejects_a_non_https_gateway_url(self) -> None:
        with self.assertRaises(ValueError):
            agent.parse_run_hook_payload(
                json.dumps(
                    self._base_payload(
                        githubGatewayUrl="http://gw.example/mcp",
                        userIdToken="header.payload.sig",
                    )
                )
            )

    def _session(self, **overrides: object) -> agent.Session:
        return agent.parse_run_hook_payload(
            json.dumps(self._base_payload(**overrides))
        )

    def test_writes_the_mcp_server_entry_claude_code_actually_reads(self) -> None:
        session = self._session(
            githubGatewayUrl="https://gw.example/mcp",
            userIdToken="header.payload.sig",
        )
        agent.configure_github_mcp_server(session)
        written = json.loads(self.config_json.read_text())
        entry = written["projects"][str(self.workspace)]["mcpServers"]["github"]
        self.assertEqual(entry["type"], "http")
        self.assertEqual(entry["url"], "https://gw.example/mcp")
        self.assertEqual(
            entry["headers"]["Authorization"], "Bearer header.payload.sig"
        )

    def test_removes_a_stale_entry_on_a_restored_workspace(self) -> None:
        # Simulates a workspace checkpoint that was last saved with the
        # GitHub tool configured, then restored into a session where the
        # control plane forwarded neither field (gateway removed, or a
        # non-portal caller).
        configured = self._session(
            githubGatewayUrl="https://gw.example/mcp",
            userIdToken="header.payload.sig",
        )
        agent.configure_github_mcp_server(configured)
        unconfigured = self._session()
        agent.configure_github_mcp_server(unconfigured)
        written = json.loads(self.config_json.read_text())
        self.assertNotIn(
            "github", written["projects"][str(self.workspace)]["mcpServers"]
        )

    def test_preserves_other_claude_json_state(self) -> None:
        self.config_json.parent.mkdir(parents=True)
        self.config_json.write_text(
            json.dumps({"firstStartVersion": "2.1.287", "projects": {}})
        )
        session = self._session(
            githubGatewayUrl="https://gw.example/mcp",
            userIdToken="header.payload.sig",
        )
        agent.configure_github_mcp_server(session)
        written = json.loads(self.config_json.read_text())
        self.assertEqual(written["firstStartVersion"], "2.1.287")


if __name__ == "__main__":
    unittest.main()
