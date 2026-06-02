"""Unit tests for ContextRouter (Water Protocol)."""
from __future__ import annotations

import pytest

from application.services.context_router import ContextRouter, ContextBudget, ContextChunk, LAYER_ORDER


class TestContextRouter:
    def test_add_chunk(self):
        router = ContextRouter()
        router.add(ContextChunk(layer="operations", content="hi", token_count=1))
        assert len(router._chunks) == 1

    def test_flow_raises_upstream(self):
        router = ContextRouter()
        with pytest.raises(ValueError):
            router.flow("operations", "studio")

    def test_flow(self):
        router = ContextRouter()
        router.add(ContextChunk(layer="studio", content="v1", token_count=10, priority=1.0))
        router.add(ContextChunk(layer="founder", content="v2", token_count=10, priority=0.9))
        router.add(ContextChunk(layer="operations", content="v3", token_count=10, priority=0.1))
        out = router.flow("studio", "operations")
        assert "v1" in out and "v2" in out

    def test_compress_on_overflow(self):
        budget = ContextBudget(max_tokens=20, per_layer_cap=20)
        router = ContextRouter(budget)
        for i in range(30):
            router.add(ContextChunk(layer="operations", content=f"c{i}", token_count=1))
        out = router.flow("studio", "operations")
        assert len(out) < 30

    def test_reset(self):
        router = ContextRouter()
        router.add(ContextChunk(layer="operations", content="x", token_count=1))
        router.reset()
        assert len(router._chunks) == 0
