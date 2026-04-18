import { ArrowRight, DoorOpen, Hash, Plus, RotateCcw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { GAME_TITLE, SUBCOPY_OPTIONS } from "@tong/shared/config";
import type { SavedSession } from "../lib/storage";

interface HomeScreenProps {
  connectionStatus: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
  nickname: string;
  savedSession: SavedSession | null;
  lastError: string | null;
  onNicknameChange: (nickname: string) => void;
  onCreateRoom: (nickname: string) => Promise<void>;
  onJoinRoom: (roomCode: string, nickname: string) => Promise<void>;
  onRejoinSavedRoom: () => Promise<void>;
}

export function HomeScreen({
  connectionStatus,
  nickname,
  savedSession,
  lastError,
  onNicknameChange,
  onCreateRoom,
  onJoinRoom,
  onRejoinSavedRoom,
}: HomeScreenProps) {
  const [roomCode, setRoomCode] = useState(savedSession?.roomCode ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"create" | "join" | "rejoin" | null>(null);

  const bannerCopy = useMemo(
    () => SUBCOPY_OPTIONS[Math.abs(nickname.length) % SUBCOPY_OPTIONS.length],
    [nickname.length],
  );

  const trimmedNickname = nickname.trim();
  const trimmedRoomCode = roomCode.trim().toUpperCase();
  const isConnecting = connectionStatus === "connecting" || connectionStatus === "reconnecting";

  async function handleCreate() {
    if (!trimmedNickname) {
      setLocalError("닉네임을 먼저 입력해 주세요.");
      return;
    }
    try {
      setLoading("create");
      setLocalError(null);
      await onCreateRoom(trimmedNickname);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "방을 만들지 못했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin() {
    if (!trimmedNickname) {
      setLocalError("닉네임을 먼저 입력해 주세요.");
      return;
    }
    if (!trimmedRoomCode) {
      setLocalError("방 코드를 입력해 주세요.");
      return;
    }
    try {
      setLoading("join");
      setLocalError(null);
      await onJoinRoom(trimmedRoomCode, trimmedNickname);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "방에 참가하지 못했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRejoin() {
    try {
      setLoading("rejoin");
      setLocalError(null);
      await onRejoinSavedRoom();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "이전 방 재접속에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="home-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">브라우저 파티 전략 게임</p>
          <h1>{GAME_TITLE}</h1>
          <p className="subcopy">{bannerCopy}</p>
          <p className="hero-description">
            친구들과 방을 만들고, 힌트를 거래하고, 10라운드 뒤 가장 큰 자산을 가져가세요.
          </p>
          <div className="hero-steps">
            <span className="pill muted">1. 닉네임 입력</span>
            <span className="pill muted">2. 새 방 또는 코드 참가</span>
            <span className="pill muted">3. 전원 준비되면 시작</span>
          </div>
          <div className="hero-note-board">
            <p className="eyebrow">시장 메모</p>
            <div className="hero-note-grid">
              <div className="hero-note-card">
                <strong>힌트는 사람에게</strong>
                <span>문장은 숨기고 메타만 보고 거래합니다.</span>
              </div>
              <div className="hero-note-card">
                <strong>주식은 시장에게</strong>
                <span>1주씩 바로 사고팔고, 가격은 정산 때 움직입니다.</span>
              </div>
              <div className="hero-note-card">
                <strong>승부는 10라운드</strong>
                <span>마지막에 순자산이 가장 큰 플레이어가 이깁니다.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="entry-panel">
          {savedSession && (
            <button className="resume-banner" disabled={isConnecting} onClick={handleRejoin} type="button">
              <span className="status-icon subtle">
                <RotateCcw size={18} />
              </span>
              <span className="resume-copy">
                <span>이전 방으로 다시 들어가기</span>
                <strong>{savedSession.roomCode}</strong>
              </span>
              {loading === "rejoin" || isConnecting ? <span>연결 중..</span> : <ArrowRight size={16} />}
            </button>
          )}

          <label className="field-block">
            <span>닉네임</span>
            <div className="input-with-icon">
              <span className="input-icon">
                <UserRound size={18} />
              </span>
              <input
                className="text-input has-icon"
                maxLength={12}
                placeholder="예: 여의도큰손"
                value={nickname}
                onChange={(event) => onNicknameChange(event.target.value)}
              />
            </div>
          </label>

          <div className="entry-flow">
            <strong>빠른 입장</strong>
            <p className="helper-copy">
              닉네임만 입력하면 새 방을 만들거나 친구 코드로 바로 들어갈 수 있습니다.
            </p>
            {isConnecting && <span className="pill info">방 연결 중</span>}
          </div>

          <div className="action-grid">
            <article className="action-card primary-path">
              <div className="action-card-head">
                <span className="status-icon warm">
                  <Plus size={18} />
                </span>
                <div>
                  <p className="eyebrow">새 방</p>
                  <h3>내가 방 만들기</h3>
                </div>
              </div>
              <p className="helper-copy">친구들을 초대하고 바로 호스트가 됩니다.</p>
              <button
                className="primary-button button-content"
                disabled={!trimmedNickname || isConnecting || loading === "join" || loading === "rejoin"}
                onClick={handleCreate}
                type="button"
              >
                <DoorOpen size={18} />
                <span>{loading === "create" ? "방 만드는 중.." : "방 만들기"}</span>
              </button>
            </article>

            <article className="action-card">
              <div className="action-card-head">
                <span className="status-icon subtle">
                  <Hash size={18} />
                </span>
                <div>
                  <p className="eyebrow">코드 참가</p>
                  <h3>친구 방으로 입장</h3>
                </div>
              </div>
              <p className="helper-copy">공유받은 5자리 코드를 넣고 바로 합류합니다.</p>
              <label className="field-block">
                <span>방 코드</span>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Hash size={18} />
                  </span>
                  <input
                    className="text-input has-icon"
                    maxLength={5}
                    placeholder="ABCDE"
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleJoin();
                      }
                    }}
                  />
                </div>
              </label>
              <button
                className="secondary-button button-content"
                disabled={
                  !trimmedNickname || !trimmedRoomCode || isConnecting || loading === "create" || loading === "rejoin"
                }
                onClick={handleJoin}
                type="button"
              >
                <ArrowRight size={18} />
                <span>{loading === "join" ? "참가 중.." : "코드로 참가"}</span>
              </button>
            </article>
          </div>

          {(localError || lastError) && <p className="inline-error">{localError ?? lastError}</p>}
        </div>
      </section>
    </main>
  );
}
