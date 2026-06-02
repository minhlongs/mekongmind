"""Shared pytest fixtures for AgencyOS tests."""
from __future__ import annotations
import pytest
import asyncio
from pathlib import Path

from application.services.event_bus import EventBus
from application.services.context_router import ContextRouter, ContextBudget
from application.interfaces.config import get_settings, AgencyOSSettings


@pytest.fixture
def event_bus() -> EventBus:
    return EventBus()


@pytest.fixture
def context_router() -> ContextRouter:
    return ContextRouter(ContextBudget(max_tokens=200_000))


@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    return tmp_path / "agencyos_data"


@pytest.fixture
def settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AGENCYOS_ENV", "test")
    monkeypatch.setenv("AGENCYOS_SQLITE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("AGENCYOS_DATA_DIR", str(tmp_path))
    return AgencyOSSettings()
