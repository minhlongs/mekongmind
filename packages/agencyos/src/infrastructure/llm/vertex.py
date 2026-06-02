from __future__ import annotations
import logging
from typing import Any
from pydantic import BaseModel, Field, ConfigDict

logger = logging.getLogger(__name__)

class VertexAIConfig(BaseModel):
    project_id: str
    location: str = "us-central1"
    model: str = "gemini-2.5-pro"
    fast_model: str = "gemini-2.5-flash"

class VertexAIProvider:
    def __init__(self, config: VertexAIConfig | None = None) -> None:
        self._cfg = config or VertexAIConfig()
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def complete(self, prompt: str, *, model: str | None = None, max_tokens: int = 1024, temperature: float = 0.2) -> str:
        self._logger.debug("Vertex complete model=%s len(prompt)=%d", model or self._cfg.model, len(prompt))
        try:
            from vertexai import init as vertex_init
            from vertexai.generative_models import GenerativeModel
            vertex_init(project=self._cfg.project_id, location=self._cfg.location)
            m = GenerativeModel(model or self._cfg.model)
            resp = m.generate_content(prompt, generation_config={"max_output_tokens": max_tokens, "temperature": temperature})
            return resp.text or ""
        except Exception as exc:  # noqa: BLE001
            self._logger.exception("Vertex completion failed: %s", exc)
            raise RuntimeError(f"VertexAIProvider.complete failed: {exc}") from exc

    async def complete_json(self, prompt: str, *, schema_desc: str = "", model: str | None = None, max_tokens: int = 2048) -> dict[str, Any]:
        json_prompt = f"{prompt}\n\nRespond with valid JSON only. Schema: {schema_desc}"
        text = await self.complete(json_prompt, model=model, max_tokens=max_tokens)
        import json
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            self._logger.warning("LLM returned non-JSON output; returning raw")
            return {"raw": text}
