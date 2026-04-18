import { useState } from "react";
import type { RedactedRoomSnapshot } from "@tong/shared/types";

interface GameEndScreenProps {
  snapshot: RedactedRoomSnapshot;
  onCreateRoom: () => Promise<void> | void;
  onGoHome: () => void;
}

export function GameEndScreen({ snapshot, onCreateRoom, onGoHome }: GameEndScreenProps) {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const winner = snapshot.leaderboard[0];
  const selfEntry = snapshot.leaderboard.find((entry) => entry.playerId === snapshot.self.id) ?? null;

  async function handleCreateRoom() {
    if (isCreatingRoom) {
      return;
    }

    setIsCreatingRoom(true);
    try {
      await onCreateRoom();
    } finally {
      setIsCreatingRoom(false);
    }
  }

  return (
    <main className="screen-shell compact-shell compact-end-shell">
      <header className="game-topbar compact-topbar">
        <div>
          <p className="eyebrow">게임 종료</p>
          <h2>{winner ? `${winner.nickname} 승리` : "최종 결과"}</h2>
        </div>
        <div className="status-strip">
          <span className="stat-pill">10라운드 완료</span>
          <span className="stat-pill">내 순위 {selfEntry?.rank ?? "-"}위</span>
          <span className="stat-pill">내 자산 {snapshot.self.netWorth}코인</span>
        </div>
      </header>

      <section className="winner-stage panel-card compact-winner-stage">
        <div className="winner-stage-copy">
          <p className="eyebrow">최종 우승자</p>
          <h3>{winner ? winner.nickname : "결과 집계 중"}</h3>
          <p className="winner-stage-note">시장보다 무서운 건 사람이다.</p>
        </div>

        <div className="winner-stage-badge">
          <span className="winner-crown">#1</span>
          <strong>{winner ? `${winner.netWorth}코인` : "-"}</strong>
          <span className="helper-copy">최종 순자산</span>
        </div>

        <div className="winner-stage-meta">
          <span className="pill action">10라운드 완주</span>
          <span className="pill info">내 순위 {selfEntry?.rank ?? "-"}위</span>
          <span className="pill muted">내 현금 {snapshot.self.cash}코인</span>
        </div>
      </section>

      <section className="end-grid compact-end-grid">
        <article className="panel-card result-board-primary">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>최종 순위</h3>
              <p className="helper-copy">누가 얼마를 가져갔는지만 먼저 보면 됩니다.</p>
            </div>
          </div>

          <div className="table-sheet">
            <div className="table-row table-head results-head leaderboard-head">
              <span>플레이어</span>
              <span>최종 자산</span>
            </div>

            {snapshot.leaderboard.map((entry) => (
              <div
                key={entry.playerId}
                className={`table-row results-row leaderboard-row ${
                  entry.rank === 1 ? "winner-row" : entry.playerId === snapshot.self.id ? "self-row" : ""
                }`}
              >
                <div className="table-entity">
                  <span className={`rank-badge rank-${Math.min(entry.rank, 3)}`}>#{entry.rank}</span>
                  <strong>{entry.nickname}</strong>
                </div>
                <span className="networth-pill">{entry.netWorth}코인</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card result-board-secondary compact-end-summary">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>내 마지막 요약</h3>
              <p className="helper-copy">내 결과만 짧게 다시 봅니다.</p>
            </div>
          </div>

          <div className="summary-stack compact-summary-stack">
            <div className="summary-line">
              <span>최종 현금</span>
              <strong>{snapshot.self.cash}코인</strong>
            </div>
            <div className="summary-line">
              <span>최종 자산</span>
              <strong>{snapshot.self.netWorth}코인</strong>
            </div>
            <div className="summary-line">
              <span>마지막 라운드 거래 수</span>
              <strong>{snapshot.lastRoundSummary?.tradeCount ?? 0}</strong>
            </div>
            <div className="summary-line">
              <span>읽은 힌트 수</span>
              <strong>{snapshot.readableHints.length}개</strong>
            </div>
          </div>
        </article>

        <article className="panel-card end-history-panel result-board-primary compact-end-history">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>가격 이력</h3>
              <p className="helper-copy">시작가 10코인에서 끝까지 어떻게 흘렀는지만 압축해 보여줍니다.</p>
            </div>
          </div>

          <div className="history-grid history-grid-scroll compact-history-grid">
            {snapshot.stocks.map((stock) => (
              <div key={stock.id} className="history-card">
                <div className="history-card-head">
                  <div className="table-entity">
                    <span className="stock-mini-badge">{stock.code}</span>
                    <div className="table-entity-copy">
                      <strong>{stock.name}</strong>
                      <span className="helper-copy">{stock.tags.join(" · ")}</span>
                    </div>
                  </div>
                  <span className="networth-pill">{stock.currentPrice}코인</span>
                </div>

                <div className="history-track">
                  {stock.priceHistory.map((price, index) => {
                    const previous = stock.priceHistory[index - 1] ?? price;
                    const tone = price > previous ? "up" : price < previous ? "down" : "flat";

                    return (
                      <span key={`${stock.id}_${index}_${price}`} className={`history-step ${tone}`}>
                        {price}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer className="phase-action-bar compact-action-bar">
        <div>
          <strong>결과 확인이 끝났다면 바로 새 방을 열거나 홈으로 돌아갈 수 있어요</strong>
        </div>
        <div className="home-actions">
          <button className="ghost-button" onClick={onGoHome} type="button">
            홈으로
          </button>
          <button className="primary-button" disabled={isCreatingRoom} onClick={() => void handleCreateRoom()} type="button">
            {isCreatingRoom ? "새 방 준비 중" : "새 방 만들기"}
          </button>
        </div>
      </footer>
    </main>
  );
}
