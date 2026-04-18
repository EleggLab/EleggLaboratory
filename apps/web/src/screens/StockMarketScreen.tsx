import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MAX_HOLD_PER_STOCK, MAX_STOCK_ACTIONS_PER_ROUND, START_PRICE } from "@tong/shared/config";
import type { ClientAction, RedactedRoomSnapshot, StockPublicView } from "@tong/shared/types";

interface StockMarketScreenProps {
  snapshot: RedactedRoomSnapshot;
  playerToken: string;
  onSendAction: (action: ClientAction) => void;
}

function getBuyBlockReason(
  stock: StockPublicView,
  freeCash: number,
  holding: number,
  stockActionsRemaining: number,
  selfDone: boolean,
) {
  if (selfDone) {
    return "이미 턴을 끝냈어요";
  }
  if (stockActionsRemaining <= 0) {
    return "이번 라운드 행동을 모두 썼어요";
  }
  if (freeCash < stock.currentPrice) {
    return "현금이 부족해요";
  }
  if (holding >= MAX_HOLD_PER_STOCK) {
    return "한 종목은 최대 4주까지예요";
  }

  return null;
}

function getSellBlockReason(holding: number, stockActionsRemaining: number, selfDone: boolean) {
  if (selfDone) {
    return "이미 턴을 끝냈어요";
  }
  if (stockActionsRemaining <= 0) {
    return "이번 라운드 행동을 모두 썼어요";
  }
  if (holding <= 0) {
    return "보유 수량이 없어요";
  }

  return null;
}

export function StockMarketScreen({
  snapshot,
  playerToken,
  onSendAction,
}: StockMarketScreenProps) {
  const [selectedStockId, setSelectedStockId] = useState<string | null>(snapshot.stocks[0]?.id ?? null);

  const freeCash = snapshot.self.cash - snapshot.self.reservedCash;
  const stockActionsRemaining = snapshot.self.stockActionsRemaining;
  const connectedCount = snapshot.players.filter((player) => player.connected).length;
  const readyCount = snapshot.players.filter((player) => player.connected && player.phaseDone).length;
  const selfDone = snapshot.phaseReadyPlayerIds.includes(snapshot.self.id);
  const activeHints = snapshot.readableHints.filter(
    (hint) => hint.phaseType === "overall" || hint.roundNumber === snapshot.roundNumber,
  );
  const archivedHintCount = snapshot.readableHints.length - activeHints.length;
  const publicHint = snapshot.publicHints[snapshot.publicHints.length - 1] ?? null;

  useEffect(() => {
    if (!selectedStockId && snapshot.stocks.length > 0) {
      setSelectedStockId(snapshot.stocks[0]!.id);
      return;
    }

    if (selectedStockId && !snapshot.stocks.some((stock) => stock.id === selectedStockId)) {
      setSelectedStockId(snapshot.stocks[0]?.id ?? null);
    }
  }, [selectedStockId, snapshot.stocks]);

  const selectedStock = snapshot.stocks.find((stock) => stock.id === selectedStockId) ?? snapshot.stocks[0] ?? null;
  const affordableCount = snapshot.stocks.filter((stock) => stock.currentPrice <= freeCash).length;
  const ownedCount = snapshot.stocks.filter((stock) => snapshot.self.holdings[stock.id] > 0).length;

  const selectedHolding = selectedStock ? snapshot.self.holdings[selectedStock.id] : 0;
  const selectedChangeFromStart = selectedStock ? selectedStock.currentPrice - START_PRICE : 0;
  const buyBlockReason = selectedStock
    ? getBuyBlockReason(selectedStock, freeCash, selectedHolding, stockActionsRemaining, selfDone)
    : "종목을 먼저 골라 주세요";
  const sellBlockReason = selectedStock
    ? getSellBlockReason(selectedHolding, stockActionsRemaining, selfDone)
    : "종목을 먼저 골라 주세요";

  const selectedMiniTrend = useMemo(() => {
    if (!selectedStock) {
      return [];
    }

    const points = selectedStock.priceHistory.slice(-5);
    const max = Math.max(...points, selectedStock.currentPrice);

    return points.map((price, index) => ({
      id: `${selectedStock.id}_${index}`,
      price,
      height: `${Math.max(24, (price / max) * 100)}%`,
      isCurrent: index === points.length - 1,
    }));
  }, [selectedStock]);

  return (
    <main className="screen-shell compact-shell market-shell">
      <header className="game-topbar compact-topbar">
        <div>
          <p className="eyebrow">라운드 {snapshot.roundNumber}</p>
          <h2>주식 거래</h2>
        </div>
        <div className="status-strip">
          <span className="stat-pill">준비 {readyCount}/{connectedCount}</span>
          <span className="stat-pill">현금 {snapshot.self.cash}코인</span>
          <span className="stat-pill">남은 행동 {stockActionsRemaining}/{MAX_STOCK_ACTIONS_PER_ROUND}</span>
        </div>
      </header>

      <section className="phase-brief">
        <div className="phase-brief-main">
          <p className="eyebrow">판단 요약</p>
          <strong>{publicHint?.content ?? "이번 단계에서는 공개 힌트를 다시 확인하며 투자만 진행해요."}</strong>
        </div>
        <div className="phase-brief-meta">
          <span className="pill muted">지금 살 수 있는 종목 {affordableCount}개</span>
          <span className="pill muted">보유 중인 종목 {ownedCount}개</span>
          <span className="pill info">힌트 거래는 닫힘</span>
        </div>
      </section>

      <section className="panel-card market-focus-bar spotlight-card">
        <div className="focus-copy">
          <p className="eyebrow">현재 포커스</p>
          {selectedStock ? (
            <>
              <h3>
                {selectedStock.code} / {selectedStock.name}
              </h3>
              <p className="helper-copy">
                현재가 {selectedStock.currentPrice}코인, 시작가 대비{" "}
                {selectedChangeFromStart >= 0 ? `+${selectedChangeFromStart}` : selectedChangeFromStart}
              </p>
            </>
          ) : (
            <>
              <h3>종목을 하나 고르면 바로 실행할 수 있어요</h3>
              <p className="helper-copy">왼쪽 리스트에서 종목을 고르면 이 구역에서 바로 사고팔 수 있어요.</p>
            </>
          )}
        </div>

        {selectedStock && (
          <div className="focus-side">
            <div className="focus-meta">
              <span className="pill success">보유 {selectedHolding}주</span>
              <span className="pill action">사용 가능 {freeCash}코인</span>
              <span className="pill info">{buyBlockReason ?? "매수 가능"}</span>
              <span className="pill muted">{sellBlockReason ?? "매도 가능"}</span>
            </div>

            <div className="mini-trend" aria-hidden="true">
              {selectedMiniTrend.map((point) => (
                <span
                  key={point.id}
                  className={`mini-trend-bar ${point.isCurrent ? "current" : ""}`}
                  style={{ height: point.height }}
                  title={`${point.price}코인`}
                />
              ))}
            </div>

            <div className="focus-actions">
              <button
                className="primary-button button-content"
                disabled={Boolean(buyBlockReason)}
                onClick={() =>
                  selectedStock &&
                  onSendAction({ type: "buyStock", playerToken, stockId: selectedStock.id })
                }
                type="button"
              >
                <ArrowUpRight size={18} />
                <span>매수 1주</span>
              </button>
              <button
                className="secondary-button button-content"
                disabled={Boolean(sellBlockReason)}
                onClick={() =>
                  selectedStock &&
                  onSendAction({ type: "sellStock", playerToken, stockId: selectedStock.id })
                }
                type="button"
              >
                <ArrowDownRight size={18} />
                <span>매도 1주</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="market-grid simple-market-grid compact-market-grid">
        <div className="market-left">
          <article className="panel-card market-board market-board-primary">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>종목 5개</h3>
                <p className="helper-copy">눌러서 고르고, 필요한 거래만 빠르게 끝내세요.</p>
              </div>
            </div>

            <div className="stock-list-scroll">
              {snapshot.stocks.map((stock) => {
                const holding = snapshot.self.holdings[stock.id];
                const buyReason = getBuyBlockReason(stock, freeCash, holding, stockActionsRemaining, selfDone);
                const sellReason = getSellBlockReason(holding, stockActionsRemaining, selfDone);
                const changeFromStart = stock.currentPrice - START_PRICE;

                return (
                  <article
                    key={stock.id}
                    className={`stock-card interactive compact-stock-card ${selectedStock?.id === stock.id ? "selected" : ""}`}
                    onClick={() => setSelectedStockId(stock.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedStockId(stock.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="stock-head">
                      <div>
                        <p className="eyebrow">{stock.code}</p>
                        <h3>{stock.name}</h3>
                      </div>
                      <strong className="stock-price">{stock.currentPrice}코인</strong>
                    </div>

                    <div className="tag-row">
                      {stock.tags.map((tag) => (
                        <span key={tag} className="pill muted">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="stock-quick-stats">
                      <span className={`pill ${changeFromStart >= 0 ? "success" : "warning"}`}>
                        시작가 대비 {changeFromStart >= 0 ? `+${changeFromStart}` : changeFromStart}
                      </span>
                      <span className="pill action">보유 {holding}주</span>
                    </div>

                    <div className="stock-foot">
                      <span className="helper-copy">
                        {buyReason ? `매수 불가: ${buyReason}` : "매수 가능"} /{" "}
                        {sellReason ? `매도 불가: ${sellReason}` : "매도 가능"}
                      </span>
                      <div className="stock-actions">
                        <button
                          className="primary-button compact"
                          disabled={Boolean(buyReason)}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSendAction({ type: "buyStock", playerToken, stockId: stock.id });
                          }}
                          type="button"
                        >
                          매수 1주
                        </button>
                        <button
                          className="secondary-button compact"
                          disabled={Boolean(sellReason)}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSendAction({ type: "sellStock", playerToken, stockId: stock.id });
                          }}
                          type="button"
                        >
                          매도 1주
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>
        </div>

        <div className="market-right">
          <article className="panel-card market-board market-board-side">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>판단 메모</h3>
                <p className="helper-copy">이번 단계에 참고할 정보만 한곳에 모았습니다.</p>
              </div>
              <span className="pill action">
                <Wallet size={14} />
                {freeCash}코인
              </span>
            </div>

            <div className="simple-section board-section">
              <h4>공개 힌트</h4>
              <div className="hint-list compact-hint-list">
                {snapshot.publicHints.map((hint) => (
                  <div key={hint.id} className="hint-card dossier-card static">
                    <p>{hint.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="simple-section board-section">
              <div className="section-row">
                <h4>내가 읽을 수 있는 힌트</h4>
                {archivedHintCount > 0 && <span className="pill muted">지난 힌트 {archivedHintCount}개 별도 보관</span>}
              </div>
              <div className="hint-list market-list-scroll compact-hint-list">
                {activeHints.map((hint) => (
                  <div key={hint.id} className="hint-card dossier-card static">
                    <p>{hint.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel-card market-board market-log-panel">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>최근 내 거래</h3>
                <p className="helper-copy">방금 산 종목과 판 종목만 짧게 보입니다.</p>
              </div>
            </div>

            <div className="log-list market-log-scroll">
              {snapshot.myRecentStockActions.length === 0 && (
                <p className="helper-copy">아직 이번 게임에서 주식 거래 기록이 없습니다.</p>
              )}
              {snapshot.myRecentStockActions.map((action) => (
                <div key={action.id} className="log-line">
                  <span>
                    {action.stockId} / {action.action === "buy" ? "매수" : "매도"}
                  </span>
                  <strong>{action.price}코인</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <footer className="phase-action-bar compact-action-bar">
        <div>
          <strong>{selfDone ? "다른 플레이어를 기다리는 중" : "필요한 거래만 끝냈다면 턴 종료를 누르세요"}</strong>
        </div>
        <button
          className="primary-button"
          disabled={selfDone}
          onClick={() => onSendAction({ type: "endTurn", playerToken })}
          type="button"
        >
          {selfDone ? "턴 종료 완료" : "턴 종료"}
        </button>
      </footer>
    </main>
  );
}
