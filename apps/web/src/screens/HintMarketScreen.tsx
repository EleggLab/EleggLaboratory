import { useEffect, useMemo, useState } from "react";
import { AD_TAGS, PRICE_OPTIONS } from "@tong/shared/config";
import type {
  BuyRequestView,
  ClientAction,
  InfoType,
  PhaseType,
  ReadableHintView,
  RedactedRoomSnapshot,
  TargetType,
} from "@tong/shared/types";
import { MetaChips } from "../components/MetaChips";

interface HintMarketScreenProps {
  snapshot: RedactedRoomSnapshot;
  playerToken: string;
  onSendAction: (action: ClientAction) => void;
}

function isMetaMatch(
  hint: { phaseType: PhaseType; targetType: TargetType; infoType: InfoType },
  request: { phaseType: PhaseType; targetType: TargetType; infoType: InfoType },
) {
  return (
    hint.phaseType === request.phaseType &&
    hint.targetType === request.targetType &&
    hint.infoType === request.infoType
  );
}

function isCurrentRoundHint(hint: ReadableHintView, roundNumber: number) {
  return hint.phaseType === "round" && hint.roundNumber === roundNumber;
}

export function HintMarketScreen({
  snapshot,
  playerToken,
  onSendAction,
}: HintMarketScreenProps) {
  const [selectedHintId, setSelectedHintId] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<(typeof PRICE_OPTIONS)[number]>(2);
  const [selectedAdTag, setSelectedAdTag] = useState<(typeof AD_TAGS)[number]>(AD_TAGS[0]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showFullBook, setShowFullBook] = useState(false);
  const [showArchivedHints, setShowArchivedHints] = useState(false);
  const [requestPhase, setRequestPhase] = useState<PhaseType>("round");
  const [requestTarget, setRequestTarget] = useState<TargetType>("single");
  const [requestInfo, setRequestInfo] = useState<InfoType>("up");
  const [requestPrice, setRequestPrice] = useState<(typeof PRICE_OPTIONS)[number]>(2);

  const playersById = useMemo(
    () =>
      Object.fromEntries(snapshot.players.map((player) => [player.id, player.nickname])) as Record<
        string,
        string
      >,
    [snapshot.players],
  );

  const activeHints = useMemo(
    () =>
      snapshot.readableHints.filter(
        (hint) => hint.phaseType === "overall" || isCurrentRoundHint(hint, snapshot.roundNumber),
      ),
    [snapshot.readableHints, snapshot.roundNumber],
  );

  const archivedHints = useMemo(
    () =>
      snapshot.readableHints.filter(
        (hint) => hint.phaseType === "round" && hint.roundNumber !== snapshot.roundNumber,
      ),
    [snapshot.readableHints, snapshot.roundNumber],
  );

  const freeCash = snapshot.self.cash - snapshot.self.reservedCash;
  const connectedCount = snapshot.players.filter((player) => player.connected).length;
  const readyCount = snapshot.players.filter((player) => player.connected && player.phaseDone).length;
  const selfDone = snapshot.phaseReadyPlayerIds.includes(snapshot.self.id);
  const selectedHint = activeHints.find((hint) => hint.id === selectedHintId) ?? null;
  const ownOpenBuyRequests = snapshot.buyRequests.filter((request) => request.buyerPlayerId === snapshot.self.id);
  const ownSellOrders = snapshot.sellOrders.filter((order) => order.sellerPlayerId === snapshot.self.id);
  const canPlaceMoreBuyRequests =
    ownOpenBuyRequests.length < snapshot.hintMarketLimits.maxBuyRequests;
  const canPlaceMoreSellOrders =
    ownSellOrders.length < snapshot.hintMarketLimits.maxSellOrders;
  const publicHint = snapshot.publicHints[snapshot.publicHints.length - 1] ?? null;

  useEffect(() => {
    if (!selectedHintId && activeHints.length > 0) {
      setSelectedHintId(activeHints[0]!.id);
      return;
    }

    if (selectedHintId && !activeHints.some((hint) => hint.id === selectedHintId)) {
      setSelectedHintId(activeHints[0]?.id ?? null);
    }
  }, [activeHints, selectedHintId]);

  const immediateRequests = useMemo(
    () =>
      snapshot.buyRequests
        .filter((request) => request.buyerPlayerId !== snapshot.self.id)
        .filter((request) => activeHints.some((hint) => hint.canSell && isMetaMatch(hint, request)))
        .sort((left, right) => right.price - left.price || left.createdAt - right.createdAt),
    [activeHints, snapshot.buyRequests, snapshot.self.id],
  );

  const affordableSellOrders = useMemo(
    () =>
      snapshot.sellOrders
        .filter((order) => order.sellerPlayerId !== snapshot.self.id)
        .filter((order) => order.price <= freeCash)
        .sort((left, right) => left.price - right.price || left.createdAt - right.createdAt),
    [freeCash, snapshot.self.id, snapshot.sellOrders],
  );

  const bestRequestByHintId = useMemo(() => {
    const entries = activeHints.map((hint) => {
      const bestRequest =
        [...snapshot.buyRequests]
          .filter((request) => request.buyerPlayerId !== snapshot.self.id)
          .filter((request) => hint.canSell && isMetaMatch(hint, request))
          .sort((left, right) => right.price - left.price || left.createdAt - right.createdAt)[0] ?? null;

      return [hint.id, bestRequest] as const;
    });

    return Object.fromEntries(entries) as Record<string, BuyRequestView | null>;
  }, [activeHints, snapshot.buyRequests, snapshot.self.id]);

  const selectedHintBestRequest = selectedHint ? bestRequestByHintId[selectedHint.id] ?? null : null;
  const selectedHintMatchCount = selectedHint
    ? snapshot.buyRequests.filter(
        (request) =>
          request.buyerPlayerId !== snapshot.self.id &&
          selectedHint.canSell &&
          isMetaMatch(selectedHint, request),
      ).length
    : 0;

  const matchingHintsForRequest = (request: BuyRequestView) =>
    activeHints.filter((hint) => hint.canSell && isMetaMatch(hint, request));

  function fulfillRequest(requestId: string, hintId: string) {
    onSendAction({
      type: "fulfillBuyRequest",
      playerToken,
      requestId,
      hintId,
    });
  }

  return (
    <main className="screen-shell compact-shell market-shell">
      <header className="game-topbar compact-topbar">
        <div>
          <p className="eyebrow">라운드 {snapshot.roundNumber}</p>
          <h2>힌트 거래</h2>
        </div>
        <div className="status-strip">
          <span className="stat-pill">준비 {readyCount}/{connectedCount}</span>
          <span className="stat-pill">현금 {snapshot.self.cash}코인</span>
          <span className="stat-pill">순자산 {snapshot.self.netWorth}코인</span>
        </div>
      </header>

      <section className="phase-brief">
        <div className="phase-brief-main">
          <p className="eyebrow">이번 공개 힌트</p>
          <strong>{publicHint?.content ?? "공개 힌트를 불러오는 중입니다."}</strong>
        </div>
        <div className="phase-brief-meta">
          <span className="pill muted">판매 {ownSellOrders.length}/{snapshot.hintMarketLimits.maxSellOrders}</span>
          <span className="pill muted">요청 {ownOpenBuyRequests.length}/{snapshot.hintMarketLimits.maxBuyRequests}</span>
          <span className="pill info">판매 가능 힌트 {activeHints.filter((hint) => hint.canSell).length}개</span>
        </div>
      </section>

      <section className="panel-card market-focus-bar spotlight-card">
        <div className="focus-copy">
          <p className="eyebrow">선택한 힌트</p>
          {selectedHint ? (
            <>
              <h3>지금 팔 수 있는지 먼저 확인하세요</h3>
              <p className="helper-copy">
                {selectedHint.canSell
                  ? selectedHintBestRequest
                    ? `즉시 판매 ${selectedHintBestRequest.price}코인 가능`
                    : `맞는 요청 ${selectedHintMatchCount}개`
                  : selectedHint.sellBlockedReason ?? "지금은 판매할 수 없습니다."}
              </p>
            </>
          ) : (
            <>
              <h3>힌트를 하나 고르면 바로 거래할 수 있습니다</h3>
              <p className="helper-copy">오른쪽 힌트를 누르면 이 구역에서 즉시 거래 가능 여부가 먼저 보입니다.</p>
            </>
          )}
        </div>
        <div className="focus-meta">
          {selectedHint && (
            <MetaChips
              phaseType={selectedHint.phaseType}
              targetType={selectedHint.targetType}
              infoType={selectedHint.infoType}
            />
          )}
          {selectedHintBestRequest && <span className="pill action">즉시 판매 {selectedHintBestRequest.price}코인</span>}
          {selectedHint && selectedHint.canSell && !selectedHintBestRequest && (
            <span className="pill info">즉시 판매 없음</span>
          )}
          {selectedHint && !selectedHint.canSell && (
            <span className="pill muted">{selectedHint.sellBlockedReason ?? "판매 불가"}</span>
          )}
        </div>
      </section>

      <section className="market-grid simple-market-grid">
        <div className="market-left">
          <article className="panel-card market-board market-board-primary">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>추천 거래</h3>
                <p className="helper-copy">바로 체결할 수 있는 거래만 먼저 보여줍니다.</p>
              </div>
            </div>

            <div className="simple-section board-section">
              <h4>내가 바로 팔 수 있는 요청</h4>
              {immediateRequests.length === 0 && (
                <p className="helper-copy">지금 맞는 매수 요청이 없습니다. 직접 판매를 올려도 됩니다.</p>
              )}
              {immediateRequests.slice(0, 4).map((request) => {
                const matchingHints = matchingHintsForRequest(request);
                const selectedHintMatches = Boolean(
                  selectedHint && selectedHint.canSell && isMetaMatch(selectedHint, request),
                );

                return (
                  <article
                    key={request.id}
                    className={`order-card recommendation-card ${selectedHintMatches ? "selected request-match" : ""}`}
                  >
                    <MetaChips
                      phaseType={request.phaseType}
                      targetType={request.targetType}
                      infoType={request.infoType}
                    />
                    <div className="order-status-row">
                      <span className="pill info">
                        {selectedHintMatches ? "선택한 힌트로 가능" : `맞는 힌트 ${matchingHints.length}개`}
                      </span>
                      <span className="pill muted">
                        {playersById[request.buyerPlayerId] ?? "플레이어"} / {request.price}코인
                      </span>
                    </div>
                    <div className="order-foot">
                      <span className="helper-copy">메타 3칩이 정확히 맞아야 체결됩니다.</span>
                      <button
                        className="primary-button compact"
                        disabled={matchingHints.length === 0 || selfDone}
                        onClick={() => {
                          if (selectedHintMatches && selectedHint) {
                            fulfillRequest(request.id, selectedHint.id);
                            return;
                          }
                          setSelectedHintId(matchingHints[0]?.id ?? null);
                        }}
                        type="button"
                      >
                        {selectedHintMatches
                          ? `즉시 판매 ${request.price}코인`
                          : matchingHints.length > 0
                            ? "맞는 힌트 보기"
                            : "매칭 힌트 없음"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="simple-section board-section">
              <h4>지금 살 수 있는 힌트</h4>
              {affordableSellOrders.length === 0 && (
                <p className="helper-copy">현재 현금으로 바로 살 수 있는 판매 주문이 없습니다.</p>
              )}
              {affordableSellOrders.slice(0, 4).map((order) => (
                <article key={order.id} className="order-card recommendation-card can-buy">
                  <MetaChips
                    phaseType={order.phaseType}
                    targetType={order.targetType}
                    infoType={order.infoType}
                  />
                  <div className="order-status-row">
                    <span className="pill action">{order.price}코인</span>
                    <span className="pill muted">{order.adTag}</span>
                  </div>
                  <div className="order-foot">
                    <span className="helper-copy">{playersById[order.sellerPlayerId] ?? "플레이어"}가 올린 힌트</span>
                    <button
                      className="primary-button compact"
                      disabled={selfDone}
                      onClick={() => onSendAction({ type: "buySellOrder", playerToken, orderId: order.id })}
                      type="button"
                    >
                      구매
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel-card market-board market-board-secondary">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>내 주문</h3>
                <p className="helper-copy">지금 걸어 둔 주문과 요청만 모아 봅니다.</p>
              </div>
              <button
                className="ghost-button compact"
                onClick={() => setShowRequestForm((value) => !value)}
                type="button"
              >
                {showRequestForm ? "요청 닫기" : "직접 요청 만들기"}
              </button>
            </div>

            <div className="simple-section board-section">
              {ownSellOrders.length === 0 && ownOpenBuyRequests.length === 0 && (
                <p className="helper-copy">아직 걸어 둔 주문이 없습니다.</p>
              )}

              {ownSellOrders.map((order) => (
                <article key={order.id} className="order-card desk-card">
                  <MetaChips phaseType={order.phaseType} targetType={order.targetType} infoType={order.infoType} />
                  <div className="order-status-row">
                    <span className="pill action">판매 {order.price}코인</span>
                    <span className="pill muted">{order.adTag}</span>
                  </div>
                  <div className="order-foot">
                    <span className="helper-copy">이번 단계가 끝나면 자동으로 정리됩니다.</span>
                    <button
                      className="ghost-button compact"
                      disabled={selfDone}
                      onClick={() => onSendAction({ type: "cancelSellOrder", playerToken, orderId: order.id })}
                      type="button"
                    >
                      취소
                    </button>
                  </div>
                </article>
              ))}

              {ownOpenBuyRequests.map((request) => (
                <article key={request.id} className="order-card desk-card">
                  <MetaChips
                    phaseType={request.phaseType}
                    targetType={request.targetType}
                    infoType={request.infoType}
                  />
                  <div className="order-status-row">
                    <span className="pill action">매수 요청 {request.price}코인</span>
                    <span className="pill muted">예약금 묶이는 중</span>
                  </div>
                  <div className="order-foot">
                    <span className="helper-copy">취소하면 예약금이 바로 돌아옵니다.</span>
                    <button
                      className="ghost-button compact"
                      disabled={selfDone}
                      onClick={() =>
                        onSendAction({
                          type: "cancelBuyRequest",
                          playerToken,
                          requestId: request.id,
                        })
                      }
                      type="button"
                    >
                      취소
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {showRequestForm && (
              <div className="simple-section board-section">
                <h4>메타만 지정해서 요청 올리기</h4>
                <div className="chip-group">
                  {(["round", "overall"] as PhaseType[]).map((value) => (
                    <button
                      key={value}
                      className={`chip-button ${requestPhase === value ? "selected" : ""}`}
                      onClick={() => setRequestPhase(value)}
                      type="button"
                    >
                      {value === "round" ? "이번" : "전체"}
                    </button>
                  ))}
                </div>

                <div className="chip-group">
                  {(["single", "tag", "market"] as TargetType[]).map((value) => (
                    <button
                      key={value}
                      className={`chip-button ${requestTarget === value ? "selected" : ""}`}
                      onClick={() => setRequestTarget(value)}
                      type="button"
                    >
                      {value === "single" ? "개별" : value === "tag" ? "태그" : "시장"}
                    </button>
                  ))}
                </div>

                <div className="chip-group">
                  {(["up", "down", "compare", "exact"] as InfoType[]).map((value) => (
                    <button
                      key={value}
                      className={`chip-button ${requestInfo === value ? "selected" : ""}`}
                      onClick={() => setRequestInfo(value)}
                      type="button"
                    >
                      {value === "up" ? "상승" : value === "down" ? "하락" : value === "compare" ? "비교" : "정확수치"}
                    </button>
                  ))}
                </div>

                <div className="price-row">
                  {PRICE_OPTIONS.map((price) => (
                    <button
                      key={price}
                      className={`price-button ${requestPrice === price ? "selected" : ""}`}
                      onClick={() => setRequestPrice(price)}
                      type="button"
                    >
                      {price}
                    </button>
                  ))}
                </div>

                <button
                  className="secondary-button"
                  disabled={!canPlaceMoreBuyRequests || requestPrice > freeCash || selfDone}
                  onClick={() =>
                    onSendAction({
                      type: "placeBuyRequest",
                      playerToken,
                      phaseType: requestPhase,
                      targetType: requestTarget,
                      infoType: requestInfo,
                      price: requestPrice,
                    })
                  }
                  type="button"
                >
                  {requestPrice}코인으로 요청 올리기
                </button>
              </div>
            )}

            <div className="simple-section board-section">
              <button
                className="ghost-button compact"
                onClick={() => setShowFullBook((value) => !value)}
                type="button"
              >
                {showFullBook ? "전체 주문 닫기" : "전체 주문 펼치기"}
              </button>

              {showFullBook && (
                <div className="order-book-columns">
                  <div className="simple-section">
                    <h4>전체 판매 주문</h4>
                    {snapshot.sellOrders.length === 0 && (
                      <p className="helper-copy">열려 있는 판매 주문이 없습니다.</p>
                    )}
                    {snapshot.sellOrders.map((order) => (
                      <article key={order.id} className="order-card desk-card">
                        <MetaChips
                          phaseType={order.phaseType}
                          targetType={order.targetType}
                          infoType={order.infoType}
                        />
                        <div className="order-status-row">
                          <span className="pill action">{order.price}코인</span>
                          <span className="pill muted">{order.adTag}</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="simple-section">
                    <h4>전체 매수 요청</h4>
                    {snapshot.buyRequests.length === 0 && (
                      <p className="helper-copy">열려 있는 매수 요청이 없습니다.</p>
                    )}
                    {snapshot.buyRequests.map((request) => (
                      <article key={request.id} className="order-card desk-card">
                        <MetaChips
                          phaseType={request.phaseType}
                          targetType={request.targetType}
                          infoType={request.infoType}
                        />
                        <div className="order-status-row">
                          <span className="pill action">{request.price}코인</span>
                          <span className="pill muted">{playersById[request.buyerPlayerId] ?? "플레이어"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="market-right">
          <article className="panel-card market-board market-board-side">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>내 힌트</h3>
                <p className="helper-copy">이번 라운드에 바로 쓸 수 있는 힌트만 먼저 봅니다.</p>
              </div>
              <span className="pill">{activeHints.length}개</span>
            </div>

            <div className="hint-list market-list-scroll">
              {activeHints.length === 0 && (
                <p className="helper-copy">이번 라운드에 바로 참고할 수 있는 힌트가 없습니다.</p>
              )}
              {activeHints.map((hint) => {
                const bestRequest = bestRequestByHintId[hint.id] ?? null;
                const matchingCount = snapshot.buyRequests.filter(
                  (request) =>
                    request.buyerPlayerId !== snapshot.self.id &&
                    hint.canSell &&
                    isMetaMatch(hint, request),
                ).length;

                return (
                  <button
                    key={hint.id}
                    className={`hint-card dossier-card ${selectedHintId === hint.id ? "selected" : ""} ${bestRequest ? "has-match" : ""}`}
                    onClick={() => setSelectedHintId(hint.id)}
                    type="button"
                  >
                    <MetaChips phaseType={hint.phaseType} targetType={hint.targetType} infoType={hint.infoType} />
                    <p>{hint.content}</p>
                    <div className="hint-status-row">
                      {hint.canSell ? (
                        bestRequest ? (
                          <span className="pill action">즉시 판매 {bestRequest.price}코인</span>
                        ) : (
                          <span className="pill success">판매 가능</span>
                        )
                      ) : (
                        <span className="pill muted">{hint.sellBlockedReason ?? "판매 불가"}</span>
                      )}
                      {matchingCount > 0 && <span className="pill info">매칭 요청 {matchingCount}개</span>}
                      {hint.acquiredRound === snapshot.roundNumber && (
                        <span className="pill warning">이번 라운드 구매</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {archivedHints.length > 0 && (
              <div className="simple-section">
                <button
                  className="ghost-button compact"
                  onClick={() => setShowArchivedHints((value) => !value)}
                  type="button"
                >
                  {showArchivedHints
                    ? `지난 라운드 힌트 ${archivedHints.length}개 닫기`
                    : `지난 라운드 힌트 ${archivedHints.length}개 보기`}
                </button>
                {showArchivedHints && (
                  <div className="hint-list">
                    {archivedHints.map((hint) => (
                      <div key={hint.id} className="hint-card dossier-card static">
                        <MetaChips
                          phaseType={hint.phaseType}
                          targetType={hint.targetType}
                          infoType={hint.infoType}
                        />
                        <p>{hint.content}</p>
                        <div className="hint-foot">
                          <span className="pill muted">지난 라운드 기록</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="panel-card market-board market-selection-panel">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>선택한 힌트 액션</h3>
                <p className="helper-copy">즉시 판매가 있으면 가장 위에서 먼저 보입니다.</p>
              </div>
            </div>

            {selectedHint ? (
              <div className="simple-section board-section">
                <MetaChips
                  phaseType={selectedHint.phaseType}
                  targetType={selectedHint.targetType}
                  infoType={selectedHint.infoType}
                />
                <p className="selected-hint-copy">{selectedHint.content}</p>

                <div className="hint-status-row">
                  {selectedHint.canSell ? (
                    <span className="pill success">판매 가능</span>
                  ) : (
                    <span className="pill muted">{selectedHint.sellBlockedReason ?? "판매 불가"}</span>
                  )}
                  {selectedHintMatchCount > 0 && (
                    <span className="pill info">매칭 요청 {selectedHintMatchCount}개</span>
                  )}
                </div>

                {selectedHintBestRequest && selectedHint.canSell && (
                  <button
                    className="primary-button"
                    disabled={selfDone}
                    onClick={() => fulfillRequest(selectedHintBestRequest.id, selectedHint.id)}
                    type="button"
                  >
                    즉시 판매 {selectedHintBestRequest.price}코인
                  </button>
                )}

                <div className="price-row">
                  {PRICE_OPTIONS.map((price) => (
                    <button
                      key={price}
                      className={`price-button ${selectedPrice === price ? "selected" : ""}`}
                      onClick={() => setSelectedPrice(price)}
                      type="button"
                    >
                      {price}
                    </button>
                  ))}
                </div>

                <div className="chip-group">
                  {AD_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className={`chip-button ${selectedAdTag === tag ? "selected" : ""}`}
                      onClick={() => setSelectedAdTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <button
                  className="secondary-button"
                  disabled={!selectedHint.canSell || !canPlaceMoreSellOrders || selfDone}
                  onClick={() =>
                    onSendAction({
                      type: "placeSellOrder",
                      playerToken,
                      hintId: selectedHint.id,
                      price: selectedPrice,
                      adTag: selectedAdTag,
                    })
                  }
                  type="button"
                >
                  판매 등록
                </button>
              </div>
            ) : (
              <p className="helper-copy">오른쪽 힌트를 하나 고르면 여기서 바로 판매 액션을 할 수 있습니다.</p>
            )}
          </article>

          <article className="panel-card market-board market-log-panel">
            <div className="panel-header compact-panel-header">
              <div>
                <h3>최근 체결</h3>
                <p className="helper-copy">문장 내용은 공개하지 않습니다.</p>
              </div>
            </div>

            <div className="log-list market-log-scroll">
              {snapshot.tradeLogs.length === 0 && (
                <p className="helper-copy">아직 체결된 거래가 없습니다.</p>
              )}
              {snapshot.tradeLogs.map((trade) => (
                <div key={trade.id} className="log-line">
                  <span>
                    {playersById[trade.sellerPlayerId] ?? "플레이어"} →{" "}
                    {playersById[trade.buyerPlayerId] ?? "플레이어"}
                  </span>
                  <MetaChips phaseType={trade.phaseType} targetType={trade.targetType} infoType={trade.infoType} />
                  <strong>{trade.price}코인</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <footer className="phase-action-bar compact-action-bar">
        <div>
          <strong>{selfDone ? "다른 플레이어를 기다리는 중" : "할 일을 마쳤으면 턴 종료를 누르세요"}</strong>
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
