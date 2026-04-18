import type { ClientAction, RedactedRoomSnapshot } from "@tong/shared/types";

interface SettlementScreenProps {
  snapshot: RedactedRoomSnapshot;
  playerToken: string;
  onSendAction: (action: ClientAction) => void;
}

export function SettlementScreen({
  snapshot,
  playerToken,
  onSendAction,
}: SettlementScreenProps) {
  const summary = snapshot.lastRoundSummary;
  const connectedCount = snapshot.players.filter((player) => player.connected).length;
  const readyCount = snapshot.players.filter((player) => player.connected && player.phaseDone).length;
  const selfDone = snapshot.phaseReadyPlayerIds.includes(snapshot.self.id);
  const currentRank =
    summary?.rank ?? snapshot.players.find((player) => player.id === snapshot.self.id)?.rank ?? "-";

  const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  return (
    <main className="screen-shell compact-shell settlement-shell">
      <header className="game-topbar compact-topbar">
        <div>
          <p className="eyebrow">라운드 {snapshot.roundNumber}</p>
          <h2>정산</h2>
        </div>
        <div className="status-strip">
          <span className="stat-pill">준비 {readyCount}/{connectedCount}</span>
          <span className="stat-pill">현재 순위 {currentRank}위</span>
        </div>
      </header>

      <section className="phase-brief">
        <div className="phase-brief-main">
          <p className="eyebrow">이번 라운드 결과</p>
          <strong>
            순자산 {summary ? formatSigned(summary.netWorthDelta) : "-"} / 힌트 거래 {summary?.hintTradeCount ?? 0}회 / 주식 거래 {summary?.stockActionCount ?? 0}회
          </strong>
        </div>
        <div className="phase-brief-meta">
          <span className="pill muted">현금 {summary ? formatSigned(summary.cashDelta) : "-"}</span>
          <span className="pill muted">평가액 {summary ? formatSigned(summary.holdingsValueDelta) : "-"}</span>
          <span className="pill info">다음 라운드 직전 체크</span>
        </div>
      </section>

      <section className="settlement-grid compact-results-grid">
        <article className="panel-card result-board-primary">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>종목 변화</h3>
              <p className="helper-copy">올랐는지 내렸는지만 빠르게 보면 됩니다.</p>
            </div>
          </div>

          <div className="table-sheet compact-table-scroll">
            <div className="table-row table-head results-head">
              <span>종목 / 요약</span>
              <span>이전 → 현재</span>
              <span>결과</span>
            </div>

            {summary?.stockChanges.map((change) => (
              <div key={change.stockId} className="table-row results-row">
                <div className="table-entity">
                  <span className="stock-mini-badge">{change.stockId.toUpperCase()}</span>
                  <div className="table-entity-copy">
                    <strong>{change.stockName}</strong>
                    <span className="helper-copy">이번 라운드 반영</span>
                  </div>
                </div>

                <div className="table-values">
                  <span className="table-price">{change.beforePrice}</span>
                  <span className="transition-arrow">→</span>
                  <strong className="table-price current">{change.afterPrice}</strong>
                </div>

                <span
                  className={`delta-pill ${
                    change.delta > 0 ? "positive" : change.delta < 0 ? "negative" : "neutral"
                  }`}
                >
                  {formatSigned(change.delta)}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card summary-card result-board-secondary">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>내 결과</h3>
              <p className="helper-copy">핵심 숫자만 남겼습니다.</p>
            </div>
          </div>

          <div className="summary-stack compact-summary-stack">
            <div className="summary-line">
              <span>현금 변화</span>
              <strong>{summary ? formatSigned(summary.cashDelta) : "-"}</strong>
            </div>
            <div className="summary-line">
              <span>평가액 변화</span>
              <strong>{summary ? formatSigned(summary.holdingsValueDelta) : "-"}</strong>
            </div>
            <div className="summary-line">
              <span>순자산 변화</span>
              <strong>{summary ? formatSigned(summary.netWorthDelta) : "-"}</strong>
            </div>
            <div className="summary-line">
              <span>힌트 거래</span>
              <strong>{summary?.hintTradeCount ?? 0}회</strong>
            </div>
            <div className="summary-line">
              <span>주식 거래</span>
              <strong>{summary?.stockActionCount ?? 0}회</strong>
            </div>
            <div className="summary-line">
              <span>현재 순위</span>
              <strong>{currentRank}위</strong>
            </div>
          </div>
        </article>
      </section>

      <footer className="phase-action-bar compact-action-bar">
        <div>
          <strong>{selfDone ? "다른 플레이어를 기다리는 중" : "결과를 봤다면 바로 다음 단계로 넘어가세요"}</strong>
        </div>
        <button
          className="primary-button"
          disabled={selfDone}
          onClick={() => onSendAction({ type: "endTurn", playerToken })}
          type="button"
        >
          {selfDone ? "확인 완료" : snapshot.roundNumber >= 10 ? "최종 결과로" : "다음 라운드"}
        </button>
      </footer>
    </main>
  );
}
