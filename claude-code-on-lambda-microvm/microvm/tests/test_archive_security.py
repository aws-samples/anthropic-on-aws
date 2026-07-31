from __future__ import annotations

import base64
import gzip
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from microvm import agent


def checkpoint_url(name: str = "checkpoint.tar.gz") -> str:
    return (
        f"https://workspace.s3.us-east-1.amazonaws.com/{name}"
        "?X-Amz-Signature=signature"
        "&X-Amz-Credential=credential"
    )


def session() -> agent.Session:
    return agent.Session(
        session_id="session-1",
        owner_hash="a" * 64,
        workspace_id="default",
        aws_region="us-east-1",
        inference_mode="bedrock",
        claude_gateway_url=None,
        bedrock_model_id="anthropic.claude-sonnet-5",
        agentcore_gateway_url=None,
        checkpoint_download_url=checkpoint_url("download.tar.gz"),
        checkpoint_upload_url=checkpoint_url("upload.tar.gz"),
        microvm_id="microvm-1",
    )


class ArchiveSecurityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def archive(
        self,
        members: list[tuple[tarfile.TarInfo, bytes | None]],
        name: str = "checkpoint.tar.gz",
    ) -> Path:
        path = self.root / name
        with tarfile.open(path, mode="w:gz") as destination:
            for member, contents in members:
                destination.addfile(
                    member,
                    io.BytesIO(contents) if contents is not None else None,
                )
        return path

    @staticmethod
    def regular(
        name: str,
        contents: bytes = b"data",
    ) -> tuple[tarfile.TarInfo, bytes]:
        member = tarfile.TarInfo(name)
        member.size = len(contents)
        member.mode = 0o640
        return member, contents

    @staticmethod
    def symlink(
        name: str,
        target: str,
    ) -> tuple[tarfile.TarInfo, None]:
        member = tarfile.TarInfo(name)
        member.type = tarfile.SYMTYPE
        member.linkname = target
        member.mode = 0o777
        return member, None

    def extract(
        self,
        archive: Path,
        suffix: str = "extract",
    ) -> Path:
        destination = self.root / suffix
        destination.mkdir()
        agent.extract_archive_safely(archive, destination)
        return destination

    def test_extracts_regular_files_and_internal_symlinks(self) -> None:
        archive = self.archive(
            [
                self.regular("data/value.txt", b"workspace"),
                self.symlink("current", "data/value.txt"),
            ]
        )

        destination = self.extract(archive)

        self.assertEqual(
            (destination / "data/value.txt").read_bytes(),
            b"workspace",
        )
        self.assertEqual(
            (destination / "current").readlink(),
            Path("data/value.txt"),
        )

    def test_rejects_absolute_and_parent_traversal_paths(self) -> None:
        for index, name in enumerate(("../outside", "/absolute/path")):
            with self.subTest(name=name):
                archive = self.archive(
                    [self.regular(name)],
                    name=f"traversal-{index}.tar.gz",
                )
                with self.assertRaisesRegex(ValueError, "path"):
                    self.extract(archive, suffix=f"extract-{index}")

    def test_rejects_symlinks_that_escape_the_workspace(self) -> None:
        archive = self.archive(
            [self.symlink("nested/link", "../../outside")]
        )

        with self.assertRaisesRegex(ValueError, "escapes"):
            self.extract(archive)

    def test_rejects_hardlinks_devices_and_fifos(self) -> None:
        member_types = (
            tarfile.LNKTYPE,
            tarfile.CHRTYPE,
            tarfile.BLKTYPE,
            tarfile.FIFOTYPE,
        )
        for index, member_type in enumerate(member_types):
            with self.subTest(member_type=member_type):
                member = tarfile.TarInfo(f"unsupported-{index}")
                member.type = member_type
                member.linkname = "target"
                archive = self.archive(
                    [(member, None)],
                    name=f"unsupported-{index}.tar.gz",
                )
                with self.assertRaisesRegex(ValueError, "unsupported"):
                    self.extract(
                        archive,
                        suffix=f"unsupported-extract-{index}",
                    )

    def test_rejects_duplicate_paths(self) -> None:
        archive = self.archive(
            [
                self.regular("duplicate", b"first"),
                self.regular("duplicate", b"second"),
            ]
        )

        with self.assertRaisesRegex(ValueError, "duplicate"):
            self.extract(archive)

    def test_enforces_the_expanded_size_limit(self) -> None:
        archive = self.archive([self.regular("large", b"12345")])

        with mock.patch.object(agent, "MAX_EXTRACTED_BYTES", 4):
            with self.assertRaisesRegex(ValueError, "configured limit"):
                self.extract(archive)


class RunPayloadTests(unittest.TestCase):
    def test_parses_direct_bedrock_session_and_checkpoint_urls(self) -> None:
        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": json.dumps(
                    {
                        "version": 3,
                        "sessionId": "session-1",
                        "ownerHash": "a" * 64,
                        "workspaceId": "payments",
                        "awsRegion": "us-east-1",
                        "inferenceMode": "bedrock",
                        "accessMode": "terminal",
                        "bedrockModelId": "anthropic.claude-sonnet-5",
                        "checkpoint": {
                            "downloadUrl": checkpoint_url("download"),
                            "uploadUrl": checkpoint_url("upload"),
                        },
                    }
                ),
            }
        )

        self.assertEqual(parsed.inference_mode, "bedrock")
        self.assertEqual(parsed.workspace_id, "payments")
        self.assertEqual(
            parsed.bedrock_model_id,
            "anthropic.claude-sonnet-5",
        )
        self.assertIsNone(parsed.claude_gateway_url)
        self.assertEqual(
            parsed.checkpoint_upload_url,
            checkpoint_url("upload"),
        )

    def test_parses_gateway_and_optional_agentcore(self) -> None:
        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": json.dumps(
                    {
                        "version": 3,
                        "sessionId": "session-1",
                        "ownerHash": "a" * 64,
                        "workspaceId": "default",
                        "awsRegion": "us-east-1",
                        "inferenceMode": "claude-gateway",
                        "accessMode": "terminal",
                        "claudeGatewayUrl": (
                            "https://claude.internal.example.com"
                        ),
                        "agentCoreGatewayUrl": (
                            "https://gateway-id.gateway."
                            "bedrock-agentcore.us-east-1.amazonaws.com/mcp"
                        ),
                        "checkpoint": {
                            "uploadUrl": checkpoint_url("upload"),
                        },
                    }
                ),
            }
        )

        self.assertEqual(
            parsed.claude_gateway_url,
            "https://claude.internal.example.com",
        )
        self.assertIsNotNone(parsed.agentcore_gateway_url)
        self.assertIsNone(parsed.checkpoint_download_url)

    def test_parses_v3_vscode_session_with_direct_claude_ai(self) -> None:
        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": json.dumps(
                    {
                        "version": 3,
                        "sessionId": "session-vscode",
                        "ownerHash": "b" * 64,
                        "workspaceId": "ide",
                        "awsRegion": "us-east-1",
                        "inferenceMode": "claude-ai",
                        "accessMode": "vscode",
                        "tunnelName": "cm-0123456789abcdef0",
                        "checkpoint": {
                            "uploadUrl": checkpoint_url("upload"),
                        },
                    }
                ),
            }
        )

        self.assertEqual(parsed.inference_mode, "claude-ai")
        self.assertEqual(parsed.access_mode, "vscode")
        self.assertEqual(
            parsed.tunnel_name,
            "cm-0123456789abcdef0",
        )
        self.assertIsNone(parsed.bedrock_model_id)
        self.assertIsNone(parsed.claude_gateway_url)

    def test_parses_a_compressed_gateway_vscode_payload(self) -> None:
        payload = {
            "version": 3,
            "sessionId": "session-vscode",
            "ownerHash": "b" * 64,
            "workspaceId": "ide",
            "awsRegion": "us-east-1",
            "inferenceMode": "claude-gateway",
            "claudeGatewayUrl": "https://claude.internal.example.com",
            "agentCoreGatewayUrl": (
                "https://gateway-id.gateway."
                "bedrock-agentcore.us-east-1.amazonaws.com/mcp"
            ),
            "accessMode": "vscode",
            "tunnelName": "cm-0123456789abcdef0",
            "checkpoint": {
                "downloadUrl": checkpoint_url("download"),
                "uploadUrl": checkpoint_url("upload"),
            },
        }
        compressed = gzip.compress(
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
        )
        encoded = (
            agent.COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX
            + base64.b64encode(compressed).decode("ascii")
        )

        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": encoded,
            }
        )

        self.assertEqual(parsed.inference_mode, "claude-gateway")
        self.assertEqual(parsed.access_mode, "vscode")
        self.assertIsNotNone(parsed.agentcore_gateway_url)
        self.assertEqual(
            parsed.checkpoint_download_url,
            checkpoint_url("download"),
        )

    def test_bedrock_model_validation_accepts_both_endpoint_families(
        self,
    ) -> None:
        accepted = (
            "anthropic.claude-sonnet-5",
            "us.anthropic.claude-sonnet-5",
            "eu.anthropic.claude-opus-5",
            "au.anthropic.claude-fable-5",
            "global.anthropic.claude-sonnet-5",
        )
        rejected = (
            "amazon.nova-pro",
            "apac.anthropic.claude-sonnet-5",
            "anthropic.not-claude-sonnet-5",
            "anthropic.claude-",
        )

        for value in accepted:
            with self.subTest(value=value):
                self.assertIsNotNone(
                    agent.BEDROCK_MODEL_PATTERN.fullmatch(value)
                )
        for value in rejected:
            with self.subTest(value=value):
                self.assertIsNone(
                    agent.BEDROCK_MODEL_PATTERN.fullmatch(value)
                )

    def test_requires_tunnel_name_only_for_vscode_sessions(self) -> None:
        base = {
            "version": 3,
            "sessionId": "session-1",
            "ownerHash": "a" * 64,
            "workspaceId": "default",
            "awsRegion": "us-east-1",
            "inferenceMode": "claude-ai",
            "checkpoint": {
                "uploadUrl": checkpoint_url("upload"),
            },
        }
        with self.assertRaisesRegex(ValueError, "tunnelName"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": json.dumps(
                        {**base, "accessMode": "vscode"}
                    ),
                }
            )
        with self.assertRaisesRegex(ValueError, "tunnelName"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": json.dumps(
                        {
                            **base,
                            "accessMode": "terminal",
                            "tunnelName": "cm-unexpected",
                        }
                    ),
                }
            )

    def test_rejects_unsupported_and_oversized_payloads(self) -> None:
        for version in (1, 2):
            with self.subTest(version=version):
                with self.assertRaisesRegex(ValueError, "Unsupported"):
                    agent.parse_run_request(
                        {
                            "microvmId": "microvm-1",
                            "runHookPayload": json.dumps(
                                {"version": version}
                            ),
                        }
                    )
        with self.assertRaisesRegex(ValueError, "runHookPayload"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": "x" * 16_385,
                }
            )
        with self.assertRaisesRegex(ValueError, "compression"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": (
                        agent.COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX
                        + "not-base64"
                    ),
                }
            )
        oversized = gzip.compress(
            json.dumps({"padding": "x" * 17_000}).encode("utf-8")
        )
        with self.assertRaisesRegex(ValueError, "decoded size"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": (
                        agent.COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX
                        + base64.b64encode(oversized).decode("ascii")
                    ),
                }
            )

    def test_rejects_wrong_region_and_nonstandard_s3_port(self) -> None:
        wrong_region = checkpoint_url().replace(
            "s3.us-east-1", "s3.us-west-2"
        )
        with self.assertRaisesRegex(ValueError, "approved S3"):
            agent.checkpoint_target(wrong_region, "us-east-1")
        with self.assertRaisesRegex(ValueError, "approved S3"):
            agent.checkpoint_target(
                checkpoint_url().replace(
                    ".amazonaws.com", ".amazonaws.com:444"
                ),
                "us-east-1",
            )


class LifecycleCheckpointTests(unittest.TestCase):
    def test_suspend_checkpoints_once_and_resume_marks_dirty(self) -> None:
        runtime = agent.Runtime()
        runtime._session = session()
        archive = Path(tempfile.mkstemp(suffix=".tar.gz")[1])
        checkpoint_client = mock.Mock()

        with (
            mock.patch.object(
                agent,
                "create_workspace_archive",
                return_value=archive,
            ) as create_archive,
            mock.patch.object(
                agent,
                "PresignedCheckpointClient",
                return_value=checkpoint_client,
            ),
        ):
            runtime.suspend()
            runtime.suspend()
            runtime.resume()
            archive.touch()
            runtime.terminate()

        self.assertEqual(create_archive.call_count, 2)
        self.assertEqual(checkpoint_client.upload.call_count, 2)
        self.assertFalse(archive.exists())

    def test_no_session_makes_terminate_a_noop(self) -> None:
        runtime = agent.Runtime()
        with mock.patch.object(agent, "create_workspace_archive") as create:
            runtime.terminate()
        create.assert_not_called()


if __name__ == "__main__":
    unittest.main()
