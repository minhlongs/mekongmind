"""ContextRouter — implements the Water Protocol (水) for context flow management.

Context flows top-to-bottom across layers:
  Studio → Founder → Business → Product → Engineering → Operations

Each layer summarizes and compresses context before passing downstream,
ensuring the local LLM on M1 Max (64GB unified memory) stays within budget.
"""
from __future__ import annotations
import logging
from typing import Any
from pydantic import BaseModel, Field, ConfigDict

logger = logging.getLogger(__name__)


class Layer(str):
    STUDIO = "studio"
    FOUNDER = "founder"
    BUSINESS = "business"
    PRODUCT = "product"
    ENGINEERING = "engineering"
    OPERATIONS = "operations"


LAYER_ORDER = [Layer.STUDIO, Layer.FOUNDER, Layer.BUSINESS, Layer.PRODUCT, Layer.ENGINEERING, Layer.OPERATIONS]


class ContextChunk(BaseModel):
    model_config = ConfigDict(frozen=True)
    layer: str
    content: str
    token_count: int = Field(ge=0)
    priority: float = Field(ge=0.0, le=1.0, default=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ContextBudget(BaseModel):
    max_tokens: int = Field(gt=0, default=200_000)
    reserved_system: int = Field(ge=0, default=4_000)
    reserved_output: int = Field(ge=0, default=8_000)
    per_layer_cap: int = Field(ge=0, default=30_000)

    @property
    def available(self) -> int:
        return max(0, self.max_tokens - self.reserved_system - self.reserved_output)


class ContextRouter:
    def __init__(self, budget: ContextBudget | None = None) -> None:
        self._budget = budget or ContextBudget()
        self._chunks: list[ContextChunk] = []
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    def add(self, chunk: ContextChunk) -> None:
        if chunk.token_count > self._budget.per_layer_cap:
            self._logger.warning("Chunk for layer=%s exceeds per-layer cap (%d > %d tokens)", chunk.layer, chunk.token_count, self._budget.per_layer_cap)
        self._chunks.append(chunk)

    def flow(self, from_layer: str, to_layer: str) -> str:
        if from_layer not in LAYER_ORDER or to_layer not in LAYER_ORDER:
            raise ValueError(f"Invalid layer: {from_layer} -> {to_layer}")
        start = LAYER_ORDER.index(from_layer)
        end = LAYER_ORDER.index(to_layer)
        if end <= start:
            raise ValueError(f"Cannot flow upstream: {from_layer} -> {to_layer}")
        relevant = [c for c in self._chunks if LAYER_ORDER.index(c.layer) <= end]
        total_tokens = sum(c.token_count for c in relevant)
        if total_tokens > self._budget.available:
            self._logger.warning("Context overflow: %d tokens > %d available", total_tokens, self._budget.available)
            relevant = self._compress(relevant)
        return "\n\n".join(c.content for c in relevant)

    def _compress(self, chunks: list[ContextChunk]) -> list[ContextChunk]:
        kept, dropped = [], []
        for c in sorted(chunks, key=lambda c: c.priority, reverse=True):
            if sum(x.token_count for x in kept) + c.token_count <= self._budget.available:
                kept.append(c)
            else:
                dropped.append(c)
        if dropped:
            self._logger.info("Compressed context: dropped %d chunks", len(dropped))
        return kept

    def reset(self) -> None:
        self._chunks.clear()
