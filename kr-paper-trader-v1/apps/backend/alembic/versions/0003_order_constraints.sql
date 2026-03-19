-- 0003_order_constraints.sql
-- duplicate working-order guard aid (DB-side helper index)

CREATE INDEX IF NOT EXISTS idx_orders_ticker_status
  ON orders (ticker, status);
