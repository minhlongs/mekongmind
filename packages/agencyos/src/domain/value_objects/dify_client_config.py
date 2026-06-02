"""DifyClientConfig value object — pure domain, no I/O."""
from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import Self
class DifyClientConfig(BaseModel):
    """Immutable configuration for a Dify API client."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)
    api_url: str = Field(..., description="Base URL, e.g. http://localhost:5001")
    api_key: str = Field(..., description="Bearer token for Dify API")
    timeout_seconds: float = Field(default=30.0, ge=1.0, description="HTTP timeout")
    max_retries: int = Field(default=2, ge=0, le=5, description="Retry count on 5xx")

    def with_api_key(self, api_key: str) -> Self:
        return self.model_copy(update={"api_key": api_key})

    @property
    def base_url(self) -> str:
        return self.api_url.rstrip("/")
