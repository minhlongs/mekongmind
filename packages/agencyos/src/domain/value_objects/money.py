"""Money + Currency — immutable monetary value objects (no float arithmetic)."""
from __future__ import annotations
from decimal import Decimal, InvalidOperation
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Currency(str, Enum):
    VND = "VND"
    USD = "USD"
    EUR = "EUR"


class Money(BaseModel):
    model_config = ConfigDict(frozen=True, validate_assignment=True)

    amount: Decimal = Field(description="Amount in minor units (e.g. VND has no subunits).")
    currency: Currency = Field(default=Currency.VND)

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, v):
        if isinstance(v, (int, float, str)):
            return Decimal(str(v))
        if isinstance(v, Decimal):
            return v
        raise InvalidOperation(f"Cannot coerce {v!r} to Decimal")

    def __add__(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise ValueError(f"Cannot add different currencies: {self.currency} != {other.currency}")
        return Money(amount=self.amount + other.amount, currency=self.currency)

    def __mul__(self, scalar: int | float | Decimal) -> Money:
        return Money(amount=(self.amount * Decimal(str(scalar))).quantize(Decimal("1")), currency=self.currency)

    def to_vnd(self, rate: Decimal) -> Money:
        return Money(amount=(self.amount * rate).quantize(Decimal("1")), currency=Currency.VND)

    def __str__(self) -> str:
        if self.currency == Currency.VND:
            return f"{int(self.amount):,} đ"
        return f"{self.amount:,.2f} {self.currency.value}"
