"""Domain entities — core business objects with strict invariants."""
from domain.entities.agent import Agent, AgentRole, AgentStatus
from domain.entities.fleet import Fleet, Vehicle, VehicleType, FleetRoute
from domain.entities.task import Task, TaskPriority, TaskStatus, TaskResult
from domain.entities.sop import StandardOperatingProcedure, SOPTemplate

__all__ = [
    "Agent",
    "AgentRole",
    "AgentStatus",
    "Fleet",
    "Vehicle",
    "VehicleType",
    "FleetRoute",
    "Task",
    "TaskPriority",
    "TaskStatus",
    "TaskResult",
    "StandardOperatingProcedure",
    "SOPTemplate",
]
