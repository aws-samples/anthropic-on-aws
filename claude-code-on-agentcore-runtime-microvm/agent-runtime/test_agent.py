"""Unit tests for the workspace checkpoint logic in agent.py.

Run with: python3 -m unittest discover -s agent-runtime
"""

from __future__ import annotations

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


if __name__ == "__main__":
    unittest.main()
