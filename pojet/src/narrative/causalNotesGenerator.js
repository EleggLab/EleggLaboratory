function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function generateCausalNotes(packet) {
  const notes = [];
  const res = packet?.delta?.resources || {};
  const rel = packet?.delta?.relation || {};
  const hp = Number(packet?.delta?.hp || 0);

  Object.entries(res).forEach(([key, value]) => {
    if (!value) return;
    notes.push(`${key} 변화 ${formatDelta(value)}가 흐름을 바꿨다.`);
  });

  Object.entries(rel).forEach(([key, value]) => {
    if (!value) return;
    notes.push(`핵심 관계의 ${key} 값이 ${formatDelta(value)}만큼 조정됐다.`);
  });

  if (hp !== 0) {
    notes.push(`체력 변동 ${formatDelta(hp)}로 위험 판단이 달라졌다.`);
  }

  if (packet?.event?.tier === "T3") notes.push("T3 이벤트라 수동 개입이 우선된다.");
  if (packet?.event?.tier === "T2") notes.push("T2 이벤트는 시간 초과 시 자동 선택 규칙이 적용된다.");

  if (packet?.phase === "rest") notes.push("휴식 단계에서 피로/체력 회복 규칙이 우선 적용됐다.");
  if (packet?.phase === "combat") notes.push("전투 단계라 생존성과 소모 자원 비중이 커졌다.");

  return notes.slice(0, 4);
}

export function deriveFollowupHooks(packet) {
  const hooks = [];
  const res = packet?.delta?.resources || {};

  if ((res.gold || 0) >= 8) hooks.push("장비/소모품 투자 여력 증가");
  if ((res.taint || 0) > 0 || Number(packet?.current?.taint || 0) >= 40) hooks.push("오염 누적으로 고위험 이벤트 확률 상승");
  if (Number(packet?.current?.fatigue || 0) >= 55) hooks.push("피로 누적으로 휴식 혹은 안전 선택 필요");
  if ((packet?.delta?.actProgress || 0) >= 15) hooks.push("막 전환 임계치 접근");
  if (packet?.event?.tier === "T3") hooks.push("핵심 서사 분기 결과가 다음 연쇄를 결정");

  return hooks.slice(0, 3);
}
