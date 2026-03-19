from sqlalchemy import String, Float, Integer, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.core.db import Base


class Instrument(Base):
    __tablename__ = "instruments"
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    market: Mapped[str] = mapped_column(String(20), default="KR")
    venue: Mapped[str] = mapped_column(String(20), default="KRX")
    sector: Mapped[str] = mapped_column(String(100), default="UNKNOWN")
    product_type: Mapped[str] = mapped_column(String(50), default="EQUITY")
    tradable: Mapped[bool] = mapped_column(Boolean, default=True)
    warning_flags: Mapped[dict] = mapped_column(JSON, default=dict)
    liquidity_class: Mapped[str] = mapped_column(String(20), default="NORMAL")


class RiskRule(Base):
    __tablename__ = "risk_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reserve_cash_pct: Mapped[float] = mapped_column(Float, default=20)
    max_positions: Mapped[int] = mapped_column(Integer, default=5)
    max_single_position_pct: Mapped[float] = mapped_column(Float, default=15)
    max_sector_exposure_pct: Mapped[float] = mapped_column(Float, default=30)
    max_daily_new_buy_pct: Mapped[float] = mapped_column(Float, default=30)
    stop_loss_pct: Mapped[float] = mapped_column(Float, default=4)
    take_profit_pct: Mapped[float] = mapped_column(Float, default=7)
    trailing_stop_pct: Mapped[float] = mapped_column(Float, default=2)
    time_stop_days: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    source: Mapped[str] = mapped_column(String(10), default="manual")
    plan_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ticker: Mapped[str] = mapped_column(String(20))
    side: Mapped[str] = mapped_column(String(8))
    intent: Mapped[str] = mapped_column(String(16))
    target_weight_pct: Mapped[float] = mapped_column(Float)
    requested_qty: Mapped[int] = mapped_column(Integer, default=0)
    remaining_qty: Mapped[int] = mapped_column(Integer, default=0)
    order_type: Mapped[str] = mapped_column(String(10), default="market")
    trigger_type: Mapped[str] = mapped_column(String(20), default="none")
    trigger_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    order_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="queued")
    venue_policy: Mapped[str] = mapped_column(String(10), default="AUTO")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(20))
    entity_type: Mapped[str] = mapped_column(String(30))
    entity_id: Mapped[str] = mapped_column(String(40))
    action: Mapped[str] = mapped_column(String(40))
    before_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SessionCalendar(Base):
    __tablename__ = "session_calendar"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trade_date: Mapped[str] = mapped_column(String(10), unique=True)  # YYYY-MM-DD
    market_state: Mapped[str] = mapped_column(String(10), default="open")
    open_time: Mapped[str] = mapped_column(String(5), default="09:00")
    close_time: Mapped[str] = mapped_column(String(5), default="15:30")
    note: Mapped[str] = mapped_column(String(200), default="")


class CorporateAction(Base):
    __tablename__ = "corporate_actions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20))
    action_type: Mapped[str] = mapped_column(String(30))
    ex_date: Mapped[str] = mapped_column(String(10))
    ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    cash_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(80), unique=True)
    role: Mapped[str] = mapped_column(String(20), default="trader")
    password_hash: Mapped[str] = mapped_column(Text)
