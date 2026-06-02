"""Unit tests for in-process event bus."""
from __future__ import annotations

import pytest
import asyncio

from application.services.event_bus import EventBus


class FakeEvent:
    def __init__(self, kind: str):
        self.event_type = kind
        self.payload = {}


class TestEventBus:
    @pytest.fixture
    def bus(self):
        return EventBus()

    @pytest.mark.asyncio
    async def test_publish_and_drain(self, bus: EventBus):
        received: list[FakeEvent] = []

        async def handler(ev):
            received.append(ev)

        bus.subscribe("foo", handler)
        await bus.publish(FakeEvent("foo"))
        assert len(received) == 1
        drained = await bus.drain("foo")
        assert len(drained) == 1

    @pytest.mark.asyncio
    async def test_unsubscribe_after_once(self, bus: EventBus):
        calls = 0

        async def handler(ev):
            nonlocal calls
            calls += 1

        bus.subscribe("bar", handler, once=True)
        await bus.publish(FakeEvent("bar"))
        await bus.publish(FakeEvent("bar"))
        assert calls == 1

    @pytest.mark.asyncio
    async def test_history_limit(self, bus: EventBus):
        bus._max_history = 5
        for _ in range(20):
            await bus.publish(FakeEvent("x"))
        assert len(bus.history) <= bus._max_history
