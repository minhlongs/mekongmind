"""In-process async event bus — pub/sub for domain events."""
from __future__ import annotations
import asyncio
import logging
from collections import defaultdict
from typing import Any, Callable, Coroutine
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class _Subscription:
    event_type: str
    handler: Callable[[Any], Coroutine[Any, Any, None]]
    once: bool = False


class EventBus:
    def __init__(self) -> None:
        self._subs: dict[str, list[_Subscription]] = defaultdict(list)
        self._history: list[Any] = []
        self._max_history: int = 10_000

    def subscribe(self, event_type: str, handler: Callable[[Any], Coroutine[Any, Any, None]], *, once: bool = False) -> None:
        self._subs[event_type].append(_Subscription(event_type=event_type, handler=handler, once=once))
        logger.debug("Subscribed to %s", event_type)

    async def publish(self, event: Any) -> None:
        event_type = getattr(event, "event_type", event.__class__.__name__)
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history :]
        handlers = list(self._subs.get(event_type, []))
        logger.debug("Publishing %s to %d handlers", event_type, len(handlers))
        for sub in handlers:
            try:
                await sub.handler(event)
                if sub.once:
                    self._subs[event_type].remove(sub)
            except Exception:  # noqa: BLE001
                logger.exception("Handler failed for %s", event_type)

    async def drain(self, event_type: str) -> list[Any]:
        return [e for e in self._history if getattr(e, "event_type", None) == event_type]

    @property
    def history(self) -> list[Any]:
        return list(self._history)
