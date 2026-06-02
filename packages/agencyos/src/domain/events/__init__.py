"""Domain events — emitted when state changes occur."""
from domain.events.task_events import (
    TaskCreatedEvent,
    TaskEnqueuedEvent,
    TaskCompletedEvent,
    TaskFailedEvent,
)
from domain.events.agent_events import (
    AgentStartedEvent,
    AgentCompletedEvent,
    AgentFailedEvent,
)
from domain.events.route_events import (
    RouteOptimizedEvent,
    RouteDispatchedEvent,
    RouteCompletedEvent,
)
from domain.events.system_events import SystemBootstrapEvent, SystemShutdownEvent

__all__ = [
    "TaskCreatedEvent",
    "TaskEnqueuedEvent",
    "TaskCompletedEvent",
    "TaskFailedEvent",
    "AgentStartedEvent",
    "AgentCompletedEvent",
    "AgentFailedEvent",
    "RouteOptimizedEvent",
    "RouteDispatchedEvent",
    "RouteCompletedEvent",
    "SystemBootstrapEvent",
    "SystemShutdownEvent",
]
