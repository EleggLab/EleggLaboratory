import { Copy, DoorOpen, LogOut, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { RedactedRoomSnapshot } from "@tong/shared/types";
import { getConnectedPlayerCount } from "@tong/shared/utils";
import { TaskGuide } from "../components/TaskGuide";

interface LobbyScreenProps {
  snapshot: RedactedRoomSnapshot;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => void;
}

export function LobbyScreen({ snapshot, onStartGame, onLeaveRoom }: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const slots = [...snapshot.players];
  const connectedCount = getConnectedPlayerCount(snapshot.players);

  while (slots.length < 4) {
    slots.push({
      id: `empty_${slots.length}`,
      nickname: "빈 자리",
      isHost: false,
      connected: false,
      phaseDone: false,
      netWorth: 0,
      rank: 0,
    });
  }

  const canStart = connectedCount >= 2;

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleStart() {
    try {
      setStarting(true);
      await onStartGame();
    } finally {
      setStarting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(snapshot.roomCode);
    setCopied(true);
  }

  return (
    <main className="screen-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">대기실</p>
          <h2>친구가 모이면 바로 시작</h2>
        </div>
        <button className="ghost-button button-content" onClick={onLeaveRoom} type="button">
          <LogOut size={18} />
          <span>나가기</span>
        </button>
      </header>

      <section className="lobby-hero">
        <article className="room-code-card">
          <div className="action-card-head">
            <span className="status-icon warm">
              <Users size={18} />
            </span>
            <div>
              <p className="eyebrow">룸 코드</p>
              <strong className="room-code-value">{snapshot.roomCode}</strong>
            </div>
          </div>
          <div className="room-code-actions">
            <button className="primary-button button-content" onClick={handleCopy} type="button">
              <Copy size={18} />
              <span>{copied ? "복사됨" : "코드 복사"}</span>
            </button>
            <span className="pill muted">{connectedCount}/4명 연결</span>
          </div>
        </article>

        <TaskGuide
          title={
            snapshot.self.isHost
              ? "코드를 공유하고 게임 시작을 눌러 주세요"
              : "호스트가 시작할 때까지 잠깐만 기다려 주세요"
          }
          description={
            snapshot.self.isHost
              ? "현재 연결된 플레이어가 2명 이상이면 바로 게임을 시작할 수 있습니다."
              : "지금은 룸 코드 공유와 인원 확인만 하면 됩니다."
          }
          meta={[
            `현재 연결 ${connectedCount}명`,
            snapshot.self.isHost ? "호스트만 시작 가능" : "시작은 호스트만",
            canStart ? "지금 시작 가능" : "아직 연결 인원 부족",
          ]}
        />
      </section>

      <section className="lobby-grid">
        {slots.map((player) => (
          <article key={player.id} className={`slot-card ${player.id.startsWith("empty_") ? "slot-empty" : ""}`}>
            <div className="slot-head">
              <strong>{player.nickname}</strong>
              {player.isHost && <span className="pill accent">호스트</span>}
            </div>
            {!player.id.startsWith("empty_") && (
              <p className={`connection-label ${player.connected ? "online" : "offline"}`}>
                {player.connected ? "연결 중" : "재접속 대기"}
              </p>
            )}
          </article>
        ))}
      </section>

      <footer className="lobby-footer">
        {snapshot.self.isHost ? (
          <>
            <button
              className="primary-button button-content"
              disabled={!canStart || starting}
              onClick={handleStart}
              type="button"
            >
              <DoorOpen size={18} />
              <span>{starting ? "시작 중..." : "게임 시작"}</span>
            </button>
            <p className="helper-copy">
              {canStart
                ? "연결된 인원이 준비됐습니다. 시작하면 바로 1라운드로 넘어갑니다."
                : "현재 연결된 플레이어가 2명 이상이어야 시작할 수 있어요."}
            </p>
          </>
        ) : (
          <p className="helper-copy">호스트가 시작하면 자동으로 다음 화면으로 넘어갑니다.</p>
        )}
      </footer>
    </main>
  );
}
