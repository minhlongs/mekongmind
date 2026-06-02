"""Unified LLM provider — single entry point, delegates to Vertex / OpenAI / Anthropic / Local."""
from __future__ import annotations
import logging
from typing import Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.llm_provider import LLMProvider, ModelId, TokenUsage

logger = logging.getLogger(__name__)


class LLMMode(str, Enum):
    VERTEX = "vertex"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"  # MLX + Ollama
    LITELLM = "litellm"


class UnifiedLLM:
    """Routes completion calls to the correct backend based on ModelId.provider."""

    def __init__(self, mode: LLMMode = LLMMode.VERTEX, **kwargs: Any) -> None:
        self._mode = mode
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")
        self._vertex = None
        self._openai_client = None
        self._anthropic_client = None
        self._litellm_model = None
        self._kwargs = kwargs
        self._usage: list[TokenUsage] = []

    def _get_vertex(self):
        if self._vertex is None:
            from infrastructure.llm.vertex import VertexAIProvider, VertexAIConfig
            cfg = VertexAIConfig(
                project_id=self._kwargs.get("vertex_project_id", ""),
                location=self._kwargs.get("vertex_location", "us-central1"),
            )
            self._vertex = VertexAIProvider(cfg)
        return self._vertex

    def _get_openai(self):
        if self._openai_client is None:
            from openai import AsyncOpenAI
            self._openai_client = AsyncOpenAI(api_key=self._kwargs.get("openai_api_key", ""))
        return self._openai_client

    def _get_anthropic(self):
        if self._anthropic_client is None:
            from anthropic import AsyncAnthropic
            self._anthropic_client = AsyncAnthropic(api_key=self._kwargs.get("anthropic_api_key", ""))
        return self._anthropic_client

    async def complete(self, prompt: str, *, model_id: ModelId | None = None, max_tokens: int = 1024, temperature: float = 0.2) -> str:
        mid = model_id or ModelId(provider=LLMProvider.VERTEX_GEMINI, model_name=self._kwargs.get("vertex_model", "gemini-2.5-pro"))
        self._logger.info("LLM call model=%s len(prompt)=%d", str(mid), len(prompt))
        if mid.provider in (LLMProvider.VERTEX_GEMINI, LLMProvider.VERTEX_GEMINI_FLASH):
            return await self._get_vertex().complete(prompt, model=mid.model_name, max_tokens=max_tokens, temperature=temperature)
        if mid.provider == LLMProvider.OPENAI_GPT4O:
            client = self._get_openai()
            resp = await client.chat.completions.create(model=mid.model_name, messages=[{"role": "user", "content": prompt}], max_tokens=max_tokens, temperature=temperature)
            usage = resp.usage
            self._usage.append(TokenUsage(prompt_tokens=usage.prompt_tokens, completion_tokens=usage.completion_tokens, total_tokens=usage.total_tokens))
            return resp.choices[0].message.content or ""
        if mid.provider == LLMProvider.ANTHROPIC_CLAUDE:
            client = self._get_anthropic()
            resp = await client.messages.create(model=mid.model_name, max_tokens=max_tokens, messages=[{"role": "user", "content": prompt}])
            usage = resp.usage
            self._usage.append(TokenUsage(prompt_tokens=usage.input_tokens, completion_tokens=usage.output_tokens, total_tokens=usage.input_tokens + usage.output_tokens))
            return resp.content[0].text if resp.content else ""
        if mid.provider in (LLMProvider.LOCAL_MLX, LLMProvider.OLLAMA):
            return await self._local_complete(prompt, model=mid, max_tokens=max_tokens, temperature=temperature)
        raise ValueError(f"Unsupported provider: {mid.provider}")

    async def _local_complete(self, prompt: str, model_id: ModelId, max_tokens: int, temperature: float) -> str:
        import httpx
        base = self._kwargs.get("litellm_api_base", "http://localhost:11434")
        model = self._kwargs.get("local_mlx_model", model_id.model_name)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{base}/v1/chat/completions", json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens, "temperature": temperature})
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @property
    def token_usage(self) -> list[TokenUsage]:
        return list(self._usage)

    @property
    def total_cost_usd(self) -> float:
        return round(sum(u.total_cost_usd for u in self._usage), 6)
