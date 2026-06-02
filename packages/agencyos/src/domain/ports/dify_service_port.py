"""DifyServicePort — use-case contract, depends only on domain types."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any
from domain.entities.dify_entities import (
    LLMApp,
    LLMAppStatus,
    LLMConversation,
    LLMMessage,
)


class DifyServicePort(ABC):
    """Thin abstraction over Dify service API."""

    @abstractmethod
    async def create_app(self, name: str, mode: str, description: str | None = None, **kwargs: Any) -> LLMApp:
        ...

    @abstractmethod
    async def publish_app(self, app_id: str) -> LLMApp:
        ...

    @abstractmethod
    async def archive_app(self, app_id: str) -> LLMApp:
        ...

    @abstractmethod
    async def get_app(self, app_id: str) -> LLMApp | None:
        ...

    @abstractmethod
    async def chat(self, app_id: str, user_message: str, user_id: str | None = None, **kwargs: Any) -> LLMConversation:
        """Send a user message and return the updated conversation with assistant reply."""

    @abstractmethod
    async def list_datasets(self) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def create_knowledge(self, name: str, description: str | None = None) -> dict[str, Any]:
        ...

    @abstractmethod
    async def upload_document(self, dataset_id: str, text: str, name: str | None = None) -> dict[str, Any]:
        ...

    @abstractmethod
    async def query_knowledge(self, dataset_id: str, query: str, top_k: int = 5) -> dict[str, Any]:
        ...
