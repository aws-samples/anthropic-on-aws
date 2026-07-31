from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

from microvm import agent


def checkpoint_url(name: str = "checkpoint.tar.gz") -> str:
    return (
        f"https://workspace.s3.us-east-1.amazonaws.com/{name}"
        "?X-Amz-Signature=signature"
        "&X-Amz-Credential=credential"
    )


def control_api_url() -> str:
    return "https://abc123.execute-api.us-east-1.amazonaws.com/v1"


def session(control_api: str | None = None) -> agent.Session:
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
        control_api_url=control_api,
    )


class FakeResponse:
    def __init__(self, status: int, body: bytes = b"") -> None:
        self.status = status
        self._body = body

    def read(self, _limit: int | None = None) -> bytes:
        body, self._body = self._body, b""
        return body

    def getheader(self, _name: str) -> str | None:
        return None


class FakeConnection:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self._responses = responses
        self.requests: list[tuple[str, str]] = []
        self.sent_bytes = 0
        self.closed = False

    def putrequest(self, method: str, target: str) -> None:
        self.requests.append((method, target))

    def putheader(self, _name: str, _value: str) -> None:
        return

    def endheaders(self) -> None:
        return

    def send(self, chunk: bytes) -> None:
        self.sent_bytes += len(chunk)

    def request(
        self,
        method: str,
        target: str,
        body: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.requests.append((method, target))

    def getresponse(self) -> FakeResponse:
        return self._responses.pop(0)

    def close(self) -> None:
        self.closed = True


class SigV4Tests(unittest.TestCase):
    def test_signature_matches_known_vector_with_session_token(self) -> None:
        headers = agent.sign_sigv4_request(
            method="POST",
            url=(
                "https://abc123.execute-api.us-east-1.amazonaws.com"
                "/v1/sessions/session-1/checkpoint-urls"
            ),
            body=json.dumps(
                {"microvmId": "microvm-1"}, separators=(",", ":")
            ).encode(),
            region="us-east-1",
            service="execute-api",
            credentials=agent.AwsCredentials(
                access_key_id="AKIDEXAMPLE",
                secret_access_key=(
                    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                ),
                session_token="IQoJb3JpZ2luX2VjEXAMPLETOKEN",
            ),
            timestamp=datetime(2026, 7, 16, 12, 0, 0, tzinfo=timezone.utc),
        )

        self.assertEqual(
            headers["Host"],
            "abc123.execute-api.us-east-1.amazonaws.com",
        )
        self.assertEqual(headers["X-Amz-Date"], "20260716T120000Z")
        self.assertEqual(
            headers["X-Amz-Security-Token"],
            "IQoJb3JpZ2luX2VjEXAMPLETOKEN",
        )
        self.assertEqual(
            headers["Authorization"],
            "AWS4-HMAC-SHA256 "
            "Credential=AKIDEXAMPLE/20260716/us-east-1/"
            "execute-api/aws4_request, "
            "SignedHeaders=host;x-amz-date;x-amz-security-token, "
            "Signature=e1e7c2c948b552942b1ce849ef8869c8"
            "46ef671b2adf7f7372ecd648f3176419",
        )

    def test_signature_without_session_token_omits_token_header(self) -> None:
        headers = agent.sign_sigv4_request(
            method="POST",
            url=(
                "https://abc123.execute-api.us-east-1.amazonaws.com"
                "/v1/sessions/session-1/checkpoint-urls"
            ),
            body=b"{}",
            region="us-east-1",
            service="execute-api",
            credentials=agent.AwsCredentials(
                access_key_id="AKIDEXAMPLE",
                secret_access_key=(
                    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                ),
                session_token=None,
            ),
            timestamp=datetime(2026, 7, 16, 12, 0, 0, tzinfo=timezone.utc),
        )

        self.assertNotIn("X-Amz-Security-Token", headers)
        self.assertIn(
            "SignedHeaders=host;x-amz-date,",
            headers["Authorization"],
        )


class ControlApiUrlValidationTests(unittest.TestCase):
    def test_accepts_valid_execute_api_url(self) -> None:
        self.assertEqual(
            agent.validated_control_api_url(
                control_api_url() + "/",
                "us-east-1",
            ),
            control_api_url(),
        )

    def test_rejects_disallowed_urls(self) -> None:
        rejected = (
            "http://abc123.execute-api.us-east-1.amazonaws.com/v1",
            "https://abc123.execute-api.us-west-2.amazonaws.com/v1",
            "https://abc123.execute-api.us-east-1.example.com/v1",
            "https://user@abc123.execute-api.us-east-1.amazonaws.com/v1",
            "https://abc123.execute-api.us-east-1.amazonaws.com/v1?x=1",
            "https://execute-api.us-east-1.amazonaws.com/v1",
        )
        for value in rejected:
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "controlApiUrl"):
                    agent.validated_control_api_url(value, "us-east-1")

    def test_run_payload_parses_optional_control_api_url(self) -> None:
        payload = {
            "version": 3,
            "sessionId": "session-1",
            "ownerHash": "a" * 64,
            "workspaceId": "default",
            "awsRegion": "us-east-1",
            "inferenceMode": "bedrock",
            "accessMode": "terminal",
            "bedrockModelId": "anthropic.claude-sonnet-5",
            "checkpoint": {"uploadUrl": checkpoint_url("upload")},
        }
        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": json.dumps(payload),
            }
        )
        self.assertIsNone(parsed.control_api_url)

        payload["controlApiUrl"] = control_api_url()
        parsed = agent.parse_run_request(
            {
                "microvmId": "microvm-1",
                "runHookPayload": json.dumps(payload),
            }
        )
        self.assertEqual(parsed.control_api_url, control_api_url())

        payload["controlApiUrl"] = "https://evil.example.com/v1"
        with self.assertRaisesRegex(ValueError, "controlApiUrl"):
            agent.parse_run_request(
                {
                    "microvmId": "microvm-1",
                    "runHookPayload": json.dumps(payload),
                }
            )


class RefreshAdoptionTests(unittest.TestCase):
    def client(
        self,
        refresher: object,
        connections: list[FakeConnection] | None = None,
        monotonic: object | None = None,
    ) -> agent.PresignedCheckpointClient:
        pending = list(connections or [])
        return agent.PresignedCheckpointClient(
            session(control_api_url()),
            refresher=refresher,
            connection_factory=lambda _target: pending.pop(0),
            monotonic=monotonic or (lambda: 0.0),
        )

    def test_refresh_adopts_valid_urls(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.return_value = (
            checkpoint_url("new-download.tar.gz"),
            checkpoint_url("new-upload.tar.gz"),
        )
        client = self.client(refresher)

        self.assertTrue(client._refresh("test"))

        self.assertEqual(
            client.urls.download_url,
            checkpoint_url("new-download.tar.gz"),
        )
        self.assertEqual(
            client.urls.upload_url,
            checkpoint_url("new-upload.tar.gz"),
        )

    def test_refresh_rejects_invalid_urls_and_keeps_old_ones(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.return_value = (
            None,
            "https://workspace.s3.us-west-2.amazonaws.com/upload"
            "?X-Amz-Signature=signature&X-Amz-Credential=credential",
        )
        client = self.client(refresher)

        self.assertFalse(client._refresh("test"))

        self.assertEqual(
            client.urls.download_url,
            checkpoint_url("download.tar.gz"),
        )
        self.assertEqual(
            client.urls.upload_url,
            checkpoint_url("upload.tar.gz"),
        )

    def test_refresh_failure_keeps_old_urls(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.side_effect = OSError("network down")
        client = self.client(refresher)

        self.assertFalse(client._refresh("test"))
        self.assertEqual(
            client.urls.upload_url,
            checkpoint_url("upload.tar.gz"),
        )

    def test_stale_urls_refresh_before_upload(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.return_value = (
            None,
            checkpoint_url("fresh-upload.tar.gz"),
        )
        connection = FakeConnection([FakeResponse(200)])
        clock = iter(
            [0.0, agent.REFRESH_URLS_AFTER_SECONDS + 1.0, 1000.0]
        )
        client = self.client(
            refresher,
            connections=[connection],
            monotonic=lambda: next(clock),
        )
        with tempfile.NamedTemporaryFile(suffix=".tar.gz") as archive:
            Path(archive.name).write_bytes(b"data")
            client.upload(Path(archive.name))

        refresher.fetch.assert_called_once()
        self.assertIn("fresh-upload.tar.gz", connection.requests[0][1])

    def test_upload_403_triggers_refresh_and_retry(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.return_value = (
            None,
            checkpoint_url("retry-upload.tar.gz"),
        )
        first = FakeConnection([FakeResponse(403, b"denied")])
        second = FakeConnection([FakeResponse(200)])
        client = self.client(refresher, connections=[first, second])

        with tempfile.NamedTemporaryFile(suffix=".tar.gz") as archive:
            Path(archive.name).write_bytes(b"data")
            client.upload(Path(archive.name))

        refresher.fetch.assert_called_once()
        self.assertIn("upload.tar.gz", first.requests[0][1])
        self.assertIn("retry-upload.tar.gz", second.requests[0][1])
        self.assertTrue(first.closed)
        self.assertTrue(second.closed)

    def test_upload_403_without_refresher_fails(self) -> None:
        connection = FakeConnection([FakeResponse(403, b"denied")])
        client = self.client(None, connections=[connection])

        with tempfile.NamedTemporaryFile(suffix=".tar.gz") as archive:
            Path(archive.name).write_bytes(b"data")
            with self.assertRaisesRegex(RuntimeError, "403"):
                client.upload(Path(archive.name))

    def test_download_403_triggers_refresh_and_retry(self) -> None:
        refresher = mock.Mock()
        refresher.fetch.return_value = (
            checkpoint_url("retry-download.tar.gz"),
            checkpoint_url("retry-upload.tar.gz"),
        )
        first = FakeConnection([FakeResponse(403, b"denied")])
        second = FakeConnection([FakeResponse(404)])
        client = self.client(refresher, connections=[first, second])

        self.assertIsNone(client.download())

        refresher.fetch.assert_called_once()
        self.assertIn("retry-download.tar.gz", second.requests[0][1])


class RefresherResponseTests(unittest.TestCase):
    def refresher(
        self, connection: FakeConnection
    ) -> agent.CheckpointUrlRefresher:
        return agent.CheckpointUrlRefresher(
            session(control_api_url()),
            credentials_provider=lambda: agent.AwsCredentials(
                access_key_id="AKIDEXAMPLE",
                secret_access_key="secret",
                session_token="token",
            ),
            connection_factory=lambda _host, _port: connection,
            clock=lambda: datetime(
                2026, 7, 16, 12, 0, 0, tzinfo=timezone.utc
            ),
        )

    def test_fetch_parses_urls_and_posts_signed_request(self) -> None:
        connection = FakeConnection(
            [
                FakeResponse(
                    200,
                    json.dumps(
                        {
                            "downloadUrl": checkpoint_url("d"),
                            "uploadUrl": checkpoint_url("u"),
                        }
                    ).encode(),
                )
            ]
        )

        download_url, upload_url = self.refresher(connection).fetch()

        self.assertEqual(download_url, checkpoint_url("d"))
        self.assertEqual(upload_url, checkpoint_url("u"))
        self.assertEqual(
            connection.requests,
            [("POST", "/v1/sessions/session-1/checkpoint-urls")],
        )

    def test_fetch_accepts_missing_download_url(self) -> None:
        connection = FakeConnection(
            [
                FakeResponse(
                    200,
                    json.dumps({"uploadUrl": checkpoint_url("u")}).encode(),
                )
            ]
        )

        download_url, upload_url = self.refresher(connection).fetch()

        self.assertIsNone(download_url)
        self.assertEqual(upload_url, checkpoint_url("u"))

    def test_fetch_rejects_non_200_and_bad_payloads(self) -> None:
        for response in (
            FakeResponse(500, b"{}"),
            FakeResponse(200, b"not json"),
            FakeResponse(200, b"[]"),
            FakeResponse(200, b"{}"),
        ):
            with self.subTest(status=response.status):
                connection = FakeConnection([response])
                with self.assertRaises(RuntimeError):
                    self.refresher(connection).fetch()


class ShutdownCheckpointTests(unittest.TestCase):
    def test_shutdown_uploads_once_and_stops_server(self) -> None:
        runtime = agent.Runtime()
        runtime._session = session()
        checkpoint_client = mock.Mock()
        runtime._checkpoint_client = checkpoint_client
        archive = Path(tempfile.mkstemp(suffix=".tar.gz")[1])
        server = mock.Mock()

        with (
            mock.patch.object(
                agent,
                "create_workspace_archive",
                return_value=archive,
            ),
            mock.patch.object(agent, "RUNTIME", runtime),
            mock.patch.object(agent, "SERVER", server),
        ):
            agent.shutdown_gracefully()
            runtime.terminate()

        self.assertEqual(checkpoint_client.upload.call_count, 1)
        server.shutdown.assert_called_once()
        self.assertFalse(archive.exists())

    def test_shutdown_respects_current_checkpoint_and_no_session(self) -> None:
        runtime = agent.Runtime()
        runtime._session = session()
        runtime._checkpoint_current = True
        server = mock.Mock()

        with (
            mock.patch.object(
                agent, "create_workspace_archive"
            ) as create_archive,
            mock.patch.object(agent, "RUNTIME", runtime),
            mock.patch.object(agent, "SERVER", server),
        ):
            agent.shutdown_gracefully()

        create_archive.assert_not_called()
        server.shutdown.assert_called_once()

        empty_runtime = agent.Runtime()
        with (
            mock.patch.object(
                agent, "create_workspace_archive"
            ) as create_archive,
            mock.patch.object(agent, "RUNTIME", empty_runtime),
            mock.patch.object(agent, "SERVER", server),
        ):
            agent.shutdown_gracefully()
        create_archive.assert_not_called()

    def test_shutdown_continues_when_checkpoint_fails(self) -> None:
        runtime = agent.Runtime()
        runtime._session = session()
        server = mock.Mock()

        with (
            mock.patch.object(
                agent,
                "create_workspace_archive",
                side_effect=RuntimeError("disk full"),
            ),
            mock.patch.object(agent, "RUNTIME", runtime),
            mock.patch.object(agent, "SERVER", server),
        ):
            agent.shutdown_gracefully()

        server.shutdown.assert_called_once()


if __name__ == "__main__":
    unittest.main()
