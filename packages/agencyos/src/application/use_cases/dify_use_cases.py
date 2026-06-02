"""Use cases for Dify integration — orchestrates the adapter."""
from __future__ import annotations
from typing import Any
from domain.value_objects.dify_client_config import DifyClientConfig
from domain.entities.dify_entities import (
    LLMApp,
    LLMAppStatus,
    LLMConversation,
    LLMMessage,
    LLMConversationRole,
)


class DifyUseCases:
    """Facade for Dify workflows — injected with a DifyServicePort."""

    def __init__(self, port: DifyServicePort, config: DifyClientConfig) -> None:
        self._port = port
        self._config = config

    async def create_llm_app(self, name: str, mode: str, description: str | None = None, **kwargs: Any) -> LLMApp:
        app = await self._port.create_app(name=name, mode=mode, description=description, **kwargs)
        return app

    async def publish_llm_app(self, app_id: str) -> LLMApp:
        return await self._port.publish_app(app_id)

    async def archive_llm_app(self, app_id: str) -> LLMApp:
        return await self._port.archive_app(app_id)

    async def get_llm_app(self, app_id: str) -> LLMApp | None:
        return await self._port.get_app(app_id)

    async def chat_with_app(
        self,
        app_id: str,
        user_message: str,
        user_id: str | None = None,
        conversation_id: str | None = None,
    ) -> tuple[LLMConversation, LLMMessage]:
        conv = await self._port.chat(app_id, user_message, user_id=user_id, conversation_id=conversation_id)
        # Rebuild from the returned conversation id
        assistant = LLMMessage(role=LLMConversationRole.ASSISTANT, content=conv.messages[-1].content if conv.messages else "")
        user = LLMMessage(role=LLMConversationRole.USER, content=user_message)
        conv_with_both = LLMConversation(
            id=conv.id,
            app_id=app_id,
            end_user_id=user_id,
            messages=[user, assistant],
        )
        return conv_with_both, assistant
