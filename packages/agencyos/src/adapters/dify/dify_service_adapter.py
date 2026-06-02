"""Concrete adapter: DifyServicePort backed by DifyHTTPClient."""
from __future__ import annotations
from typing import Any
from domain.entities.dify_entities import (
    LLMApp,
    LLMAppStatus,
    LLMConversation,
    LLMMessage,
    LLMConversationRole,
)
from domain.ports.dify_service_port import DifyServicePort
from adapters.dify.dify_http_client import DifyHTTPClient


def _to_dify_mode(mode: str) -> str:
    return mode.lower().replace("_", "-").replace(" ", "-")


def _map_app(raw: dict) -> LLMApp:
    return LLMApp(
        id=raw["id"],
        dify_app_id=raw.get("id"),
        name=raw.get("name", ""),
        description=raw.get("description"),
        mode=raw.get("mode", "chat"),
        status=LLMAppStatus(raw.get("status", LLMAppStatus.DRAFT.value)),
        model_config=raw.get("model_config", {}),
        created_at=raw.get("created_at", ""),
        updated_at=raw.get("updated_at", ""),
    )


def _map_conversation(raw: dict) -> LLMConversation:
    msgs = []
    for m in raw.get("messages", []):
        msgs.append(
            LLMMessage(
                role=LLMConversationRole(m.get("role", "user")),
                content=m.get("content", ""),
                metadata=m.get("metadata", {}),
            )
        )
    return LLMConversation(
        id=raw.get("conversation_id", ""),
        app_id=raw.get("app_id", ""),
        end_user_id=raw.get("user_id"),
        messages=msgs,
        metadata=raw.get("metadata", {}),
    )


class DifyServiceAdapter(DifyServicePort):
    """Implements DifyServicePort by wrapping the sync DifyHTTPClient."""

    def __init__(self, cfg: Any, http_client: DifyHTTPClient) -> None:
        self._cfg = cfg
        self._client = http_client

    async def create_app(self, name: str, mode: str, description: str | None = None, **kwargs: Any) -> LLMApp:
        from adapters.dify.models import DifyAppMode
        body = {"name": name, "mode": _to_dify_mode(mode)}
        if description:
            body["description"] = description
        body.update(kwargs)
        resp = self._client.create_app(body)
        return _map_app(resp.model_dump() if hasattr(resp, "model_dump") else resp)

    async def publish_app(self, app_id: str) -> LLMApp:
        raw = self._client.publish_app(app_id)
        return _map_app(raw)

    async def archive_app(self, app_id: str) -> LLMApp:
        raw = self._client.get_app(app_id)
        if not raw:
            raise ValueError(f"App {app_id} not found")
        app = _map_app(raw)
        app.archive()
        return app

    async def get_app(self, app_id: str) -> LLMApp | None:
        raw = self._client.get_app(app_id)
        if not raw:
            return None
        return _map_app(raw)

    async def chat(self, app_id: str, user_message: str, user_id: str | None = None, **kwargs: Any) -> LLMConversation:
        conv_id = kwargs.pop("conversation_id", None)
        resp = self._client.chat(
            query=user_message,
            user=user_id or "anonymous",
            conversation_id=conv_id,
            response_mode="blocking",
        )
        raw = resp.model_dump() if hasattr(resp, "model_dump") else resp
        c = _map_conversation(raw)
        c.app_id = app_id
        return c

    async def list_datasets(self) -> list[dict[str, Any]]:
        return self._client.list_datasets()

    async def create_knowledge(self, name: str, description: str | None = None) -> dict[str, Any]:
        return self._client.create_dataset(name=name, description=description)

    async def upload_document(self, dataset_id: str, text: str, name: str | None = None) -> dict[str, Any]:
        return self._client.upload_document(dataset_id=dataset_id, text=text, name=name)

    async def query_knowledge(self, dataset_id: str, query: str, top_k: int = 5) -> dict[str, Any]:
        return self._client.query_dataset(dataset_id=dataset_id, query=query, top_k=top_k)
