"""AgencyOS configuration — single source of truth."""
from __future__ import annotations
import os
from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgencyOSSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = Field(default="development", pattern="^(development|staging|production)$")

    # LLM
    llm_provider: str = Field(default="vertex")
    vertex_project_id: str = Field(default="")
    vertex_location: str = Field(default="us-central1")
    vertex_model: str = Field(default="gemini-2.5-pro")
    vertex_model_fast: str = Field(default="gemini-2.5-flash")
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    local_mlx_model: str = Field(default="")
    litellm_api_base: str = Field(default="http://localhost:11434")

    # Routing / Water Protocol
    water_protocol_enabled: bool = True
    context_window_max_tokens: int = 200_000

    # Fleet / Route
    default_carrier: str = "internal"
    route_solver: str = "ortools_cvrp"
    route_optimization_timeout_s: int = 60

    # Telemetry
    sentry_dsn: str = Field(default="")
    otel_exporter_endpoint: str = Field(default="http://localhost:4318/v1/traces")
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")

    # Storage
    sqlite_path: str = Field(default="./data/agencyos.db")
    data_dir: Path = Field(default_factory=lambda: Path("./data"))

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.data_dir / 'agencyos.db'}"


@lru_cache
def get_settings() -> AgencyOSSettings:
    return AgencyOSSettings()
