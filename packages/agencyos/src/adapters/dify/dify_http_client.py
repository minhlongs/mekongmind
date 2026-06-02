"""Dify REST API client — thin, sync-style methods (used by async wrapper)."""
from __future__ import annotations
import httpx
from domain.value_objects.dify_client_config import DifyClientConfig
from adapters.dify.models import (
    DifyAppCreateRequest,
    DifyAppCreateResponse,
    DifyChatResponse,
)


class DifyHTTPClient:
    """Sync-style client for Dify Service API; wrap in asyncio via to_thread / asyncio.run_in_executor."""

    def __init__(self, cfg: DifyClientConfig) -> None:
        self.cfg = cfg
        self._client = httpx.Client(
            base_url=cfg.base_url,
            headers={
                "Authorization": f"Bearer {cfg.api_key}",
                "Content-Type": "application/json",
            },
            timeout=cfg.timeout_seconds,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "DifyHTTPClient":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # ---- App lifecycle -------------------------------------------------
    def create_app(self, payload: DifyAppCreateRequest) -> DifyAppCreateResponse:
        r = self._client.post("/v1/apps", json=payload.model_dump())
        r.raise_for_status()
        return DifyAppCreateResponse(**r.json())

    def get_app(self, app_id: str) -> dict:
        r = self._client.get(f"/v1/apps/{app_id}")
        if r.status_code == 404:
            return {}
        r.raise_for_status()
        return r.json()

    def publish_app(self, app_id: str) -> dict:
        r = self._client.post(f"/v1/apps/{app_id}/publish")
        r.raise_for_status()
        return r.json()

    # ---- Chat ----------------------------------------------------------
    def chat(self, *, query: str, user: str, conversation_id: str | None = None, response_mode: str = "blocking") -> DifyChatResponse:
        body: dict = {
            "query": query,
            "user": user,
            "response_mode": response_mode,
        }
        if conversation_id:
            body["conversation_id"] = conversation_id
        r = self._client.post(f"/v1/chat-messages", json=body)
        r.raise_for_status()
        return DifyChatResponse(**r.json())

    # ---- Knowledge / datasets ------------------------------------------
    def list_datasets(self) -> list[dict]:
        r = self._client.get("/v1/datasets")
        r.raise_for_status()
        data = r.json()
        return data.get("data", [])

    def create_dataset(self, name: str, description: str | None = None) -> dict:
        body = {"name": name}
        if description:
            body["description"] = description
        r = self._client.post("/v1/datasets", json=body)
        r.raise_for_status()
        return r.json()

    def upload_document(self, dataset_id: str, text: str, name: str | None = None) -> dict:
        r = self._client.post(
            f"/v1/datasets/{dataset_id}/document/create-by-text",
            data={"text": text},
            files={} if name is None else {"name": (None, name)},
        )
        r.raise_for_status()
        return r.json()

    def query_dataset(self, dataset_id: str, query: str, top_k: int = 5) -> dict:
        r = self._client.post(
            f"/v1/datasets/{dataset_id}/retrieve",
            json={"query": query, "top_k": top_k},
        )
        r.raise_for_status()
        return r.json()
