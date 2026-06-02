"""LLMProvider + ModelId + TokenUsage — provider/model identity VO."""
from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class LLMProvider(str, Enum):
    VERTEX_GEMINI = "vertex_gemini"
    VERTEX_GEMINI_FLASH = "vertex_gemini_flash"
    OPENAI_GPT4O = "openai_gpt4o"
    OPENAI_GPT4O_MINI = "openai_gpt4o_mini"
    ANTHROPIC_CLAUDE = "anthropic_claude"
    ANTHROPIC_CLAUDE_OPUS = "anthropic_claude_opus"
    LOCAL_MLX = "local_mlx"
    OLLAMA = "ollama"
    LITELLM = "litellm"


class ModelId(BaseModel):
    model_config = ConfigDict(frozen=True)

    provider: LLMProvider
    model_name: str = Field(min_length=1, max_length=200)

    def __str__(self) -> str:
        return f"{self.provider.value}:{self.model_name}"

    @property
    def is_local(self) -> bool:
        return self.provider in (LLMProvider.LOCAL_MLX, LLMProvider.OLLAMA)

    @property
    def is_cloud(self) -> bool:
        return not self.is_local


class TokenUsage(BaseModel):
    model_config = ConfigDict(frozen=True)

    prompt_tokens: int = Field(ge=0)
    completion_tokens: int = Field(ge=0)
    total_tokens: int = Field(ge=0)
    prompt_cost_usd: float = Field(ge=0, default=0.0)
    completion_cost_usd: float = Field(ge=0, default=0.0)

    @property
    def total_cost_usd(self) -> float:
        return round(self.prompt_cost_usd + self.completion_cost_usd, 6)
