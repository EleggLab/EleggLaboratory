-- 0002_domain_tables.sql
-- NOTE: bootstrap SQL migration for local/dev reproducibility.

CREATE TABLE IF NOT EXISTS session_calendar (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  trade_date VARCHAR(10) UNIQUE NOT NULL,
  market_state VARCHAR(10) NOT NULL DEFAULT 'open',
  open_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  close_time VARCHAR(5) NOT NULL DEFAULT '15:30',
  note VARCHAR(200) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS corporate_actions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ticker VARCHAR(20) NOT NULL,
  action_type VARCHAR(30) NOT NULL,
  ex_date VARCHAR(10) NOT NULL,
  ratio FLOAT NULL,
  cash_amount FLOAT NULL,
  raw_payload JSON NULL
);

CREATE INDEX IF NOT EXISTS idx_corporate_actions_ticker_date
  ON corporate_actions (ticker, ex_date);
