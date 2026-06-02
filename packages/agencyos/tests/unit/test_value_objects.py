"""Unit tests for value objects."""
from __future__ import annotations
import pytest

from domain.value_objects.agent_id import AgentId
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.money import Money, Currency
from domain.value_objects.llm_provider import LLMProvider, ModelId, TokenUsage
from domain.value_objects.task_id import TaskId


class TestAgentId:
    def test_default_is_uuid(self):
        a = AgentId()
        assert len(a.value) == 36

    def test_eq_same_value(self):
        v = str(AgentId().value)
        assert AgentId(value=v) == AgentId(value=v)

    def test_hashable(self):
        s = {AgentId()}
        assert len(s) == 1


class TestCoordinates:
    def test_haversine_zero(self):
        c = Coordinates(lat=10.0, lng=106.0)
        assert abs(c.haversine_km(c)) < 1e-6

    def test_wkt(self):
        c = Coordinates(lat=10.0, lng=106.0)
        assert c.to_wkt() == "POINT(106.0 10.0)"

    def test_haversine_hcm_hanoi(self):
        hcm = Coordinates(lat=10.8231, lng=106.6297)
        hanoi = Coordinates(lat=21.0278, lng=105.8342)
        d = hcm.haversine_km(hanoi)
        assert 1100 < d < 1200


class TestMoney:
    def test_add_same_currency(self):
        a = Money(amount=1000, currency=Currency.VND)
        b = Money(amount=2000, currency=Currency.VND)
        assert (a + b).amount == 3000

    def test_add_different_currency_raises(self):
        a = Money(amount=10, currency=Currency.USD)
        b = Money(amount=20, currency=Currency.VND)
        with pytest.raises(ValueError):
            _ = a + b

    def test_str_vnd(self):
        m = Money(amount=150_000, currency=Currency.VND)
        assert "150,000" in str(m)


class TestLLMProvider:
    def test_local_flag(self):
        assert ModelId(provider=LLMProvider.LOCAL_MLX, model_name="mlx").is_local
        assert not ModelId(provider=LLMProvider.VERTEX_GEMINI, model_name="gemini-2.5-pro").is_local

    def test_str(self):
        m = ModelId(provider=LLMProvider.OPENAI_GPT4O, model_name="gpt-4o")
        assert str(m) == "openai_gpt4o:gpt-4o"


class TestTokenUsage:
    def test_total_cost(self):
        u = TokenUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300, prompt_cost_usd=0.001, completion_cost_usd=0.002)
        assert abs(u.total_cost_usd - 0.003) < 1e-9


class TestTaskId:
    def test_default_uuid(self):
        t = TaskId()
        assert len(t.value) == 36
