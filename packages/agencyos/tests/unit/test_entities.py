"""Unit tests for domain entities."""
from __future__ import annotations

import pytest

from domain.entities.agent import Agent, AgentRole, AgentStatus
from domain.entities.task import Task, TaskPriority, TaskStatus, TaskResult
from domain.entities.fleet import Fleet, Vehicle, VehicleType, VehicleStatus
from domain.value_objects.agent_id import AgentId
from domain.value_objects.coordinates import Coordinates


class TestAgent:
    def test_create_and_start(self):
        agent = Agent(id=AgentId(), role=AgentRole.OPERATIONS)
        assert agent.status == AgentStatus.IDLE
        agent.start()
        assert agent.status == AgentStatus.RUNNING

    def test_start_from_non_idle_raises(self):
        agent = Agent(id=AgentId(), role=AgentRole.OPERATIONS)
        agent.status = AgentStatus.RETIRED
        with pytest.raises(ValueError):
            agent.start()

    def test_complete(self):
        agent = Agent(id=AgentId(), role=AgentRole.OPERATIONS)
        agent.start()
        agent.complete("route optimized")
        assert agent.status == AgentStatus.IDLE
        assert agent.metadata.last_output == "route optimized"

    def test_fail(self):
        agent = Agent(id=AgentId(), role=AgentRole.OPERATIONS)
        agent.fail("solver timeout")
        assert agent.status == AgentStatus.ERROR
        assert agent.metadata.last_error == "solver timeout"


class TestTask:
    def test_enqueue_and_start(self):
        task = Task(title="Optimize route", role="operations")
        assert task.status == TaskStatus.PENDING
        task.enqueue()
        assert task.status == TaskStatus.QUEUED
        task.start()
        assert task.status == TaskStatus.RUNNING

    def test_complete(self):
        task = Task(title="Optimize route", role="operations")
        task.enqueue()
        task.start()
        task.complete(TaskResult(output="ok", exit_code=0))
        assert task.status == TaskStatus.COMPLETED

    def test_retry(self):
        task = Task(title="route", role="operations", max_retries=1)
        task.enqueue()
        task.start()
        task.fail("transient", retry=True)
        assert task.status == TaskStatus.RETRYING
        assert task.retry_count == 1

    def test_retry_exhausted(self):
        task = Task(title="route", role="operations", max_retries=0)
        task.enqueue()
        task.start()
        task.fail("fail", retry=True)
        assert task.status == TaskStatus.FAILED


class TestFleet:
    def test_register_vehicle(self):
        depot = Coordinates(lat=10.0, lng=106.0)
        fleet = Fleet(fleet_id="f1", company_id="c1")
        v = Vehicle(vehicle_id="v1", vehicle_type=VehicleType.VAN, depot=depot, carrier="internal")
        fleet.register_vehicle(v)
        assert len(fleet.vehicles) == 1

    def test_register_duplicate_raises(self):
        depot = Coordinates(lat=10.0, lng=106.0)
        fleet = Fleet(fleet_id="f1", company_id="c1")
        v = Vehicle(vehicle_id="v1", vehicle_type=VehicleType.VAN, depot=depot, carrier="internal")
        fleet.register_vehicle(v)
        with pytest.raises(ValueError):
            fleet.register_vehicle(v)

    def test_available_vehicles(self):
        depot = Coordinates(lat=10.0, lng=106.0)
        fleet = Fleet(fleet_id="f1", company_id="c1")
        fleet.register_vehicle(Vehicle(vehicle_id="v1", vehicle_type=VehicleType.VAN, depot=depot, carrier="internal"))
        fleet.register_vehicle(Vehicle(vehicle_id="v2", vehicle_type=VehicleType.MOTORBIKE, depot=depot, carrier="internal", status=VehicleStatus.ASSIGNED))
        avail = fleet.available_vehicles()
        assert len(avail) == 1
