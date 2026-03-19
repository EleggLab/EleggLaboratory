from math import floor


def _safe_price(q: dict | None) -> float:
    if not q:
        return 0.0
    for k in ("ask1", "bid1", "last"):
        v = q.get(k)
        if v is not None and float(v) > 0:
            return float(v)
    return 0.0


def compile_target_weights(
    *,
    positions: dict[str, dict],
    quotes: dict[str, dict],
    cash: float,
    targets: list[dict],
    reserve_cash_pct: float,
    max_single_position_pct: float,
    max_positions: int,
    max_sector_exposure_pct: float | None = None,
    max_daily_new_buy_pct: float | None = None,
    instrument_meta: dict[str, dict] | None = None,
    default_order_type: str = "market",
    default_trigger_type: str = "none",
):
    """Compile target_weight_pct portfolio intent into executable tranche orders.
    Returns dict: {orders, rejected, summary}
    """
    # total asset = cash + marked market value
    total_asset = float(cash)
    current_values = {}
    for t, p in positions.items():
        price = _safe_price(quotes.get(t)) or float(p.get("avg_price", 0) or 0)
        mv = float(p.get("quantity", 0)) * price
        current_values[t] = mv
        total_asset += mv

    investable = max(0.0, total_asset * (1 - reserve_cash_pct / 100.0))

    orders = []
    rejected = []
    instrument_meta = instrument_meta or {}

    valid_targets = [x for x in targets if float(x.get("target_weight_pct", 0)) > 0]
    if len(valid_targets) > int(max_positions):
        rejected.append({"reason": "max_positions exceeded", "count": len(valid_targets), "limit": int(max_positions)})
        valid_targets = valid_targets[: int(max_positions)]

    # map target weights by ticker
    tmap = {str(x["ticker"]): float(x.get("target_weight_pct", 0)) for x in valid_targets if "ticker" in x}

    # current sector exposure snapshot
    sector_values = {}
    for t, val in current_values.items():
        sec = (instrument_meta.get(t, {}) or {}).get("sector", "UNKNOWN")
        sector_values[sec] = sector_values.get(sec, 0.0) + val

    # ensure held-but-not-target tickers can be reduced/exited
    universe = set(tmap.keys()) | set(positions.keys())

    daily_new_buy_limit_value = None
    if max_daily_new_buy_pct is not None:
        daily_new_buy_limit_value = total_asset * (float(max_daily_new_buy_pct) / 100.0)
    daily_new_buy_used = 0.0

    for ticker in sorted(universe):
        tw = float(tmap.get(ticker, 0.0))
        if tw > float(max_single_position_pct):
            rejected.append({"ticker": ticker, "reason": "max_single_position_pct exceeded", "target_weight_pct": tw})
            tw = float(max_single_position_pct)

        quote = quotes.get(ticker)
        px = _safe_price(quote)
        if px <= 0:
            rejected.append({"ticker": ticker, "reason": "missing/invalid price"})
            continue

        current_qty = int(positions.get(ticker, {}).get("quantity", 0) or 0)
        current_value = float(current_qty) * px
        current_weight = (current_value / total_asset * 100.0) if total_asset > 0 else 0.0

        target_value = investable * (tw / 100.0)
        delta_value = target_value - current_value

        if abs(delta_value) < px:  # less than 1 share
            continue

        side = "buy" if delta_value > 0 else "sell"
        qty = floor(abs(delta_value) / px)
        if qty <= 0:
            continue

        if side == "buy":
            intent = "enter" if current_qty == 0 else "add"
            est_cost = qty * px

            # daily new buy cap
            if daily_new_buy_limit_value is not None:
                remain = max(0.0, daily_new_buy_limit_value - daily_new_buy_used)
                if est_cost > remain:
                    qty = floor(remain / px)
                    est_cost = qty * px
                if qty <= 0:
                    rejected.append({"ticker": ticker, "reason": "max_daily_new_buy_pct exceeded"})
                    continue

            # sector cap (post-order estimate)
            sec = (instrument_meta.get(ticker, {}) or {}).get("sector", "UNKNOWN")
            if max_sector_exposure_pct is not None:
                projected_sec = sector_values.get(sec, 0.0) + est_cost
                projected_pct = (projected_sec / total_asset * 100.0) if total_asset > 0 else 0.0
                if projected_pct > float(max_sector_exposure_pct):
                    allowed_value = max(0.0, total_asset * (float(max_sector_exposure_pct) / 100.0) - sector_values.get(sec, 0.0))
                    qty = floor(allowed_value / px)
                    est_cost = qty * px
                    if qty <= 0:
                        rejected.append({"ticker": ticker, "reason": "max_sector_exposure_pct exceeded", "sector": sec})
                        continue

            if est_cost > cash:
                qty = floor(max(0.0, cash) / px)
                est_cost = qty * px
            if qty <= 0:
                rejected.append({"ticker": ticker, "reason": "overspend prevented"})
                continue
            cash -= est_cost
            daily_new_buy_used += est_cost
            sec = (instrument_meta.get(ticker, {}) or {}).get("sector", "UNKNOWN")
            sector_values[sec] = sector_values.get(sec, 0.0) + est_cost
        else:
            qty = min(qty, current_qty)
            if qty <= 0:
                continue
            intent = "exit" if qty == current_qty else "reduce"

        orders.append(
            {
                "ticker": ticker,
                "side": side,
                "intent": intent,
                "target_weight_pct": round(tw, 4),
                "requested_qty": int(qty),
                "order_type": default_order_type,
                "trigger_type": default_trigger_type,
            }
        )

    return {
        "orders": orders,
        "rejected": rejected,
        "summary": {
            "total_asset": round(total_asset, 2),
            "reserve_cash_pct": reserve_cash_pct,
            "investable_asset": round(investable, 2),
            "daily_new_buy_used": round(daily_new_buy_used, 2),
            "generated_orders": len(orders),
            "rejected_items": len(rejected),
        },
    }
