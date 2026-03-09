function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function labelOf(key) {
  return {
    gold: "금화",
    supplies: "보급",
    fatigue: "피로",
    taint: "오염",
    renown: "명성",
    infamy: "악명",
    trust: "신뢰",
    intimacy: "친밀",
    tension: "긴장",
    desire: "욕망",
    respect: "존중",
    fear: "두려움"
  }[key] || key;
}

export function generateCausalNotes(packet) {
  const notes = [];
  const res = packet?.delta?.resources || {};
  const rel = packet?.delta?.relation || {};
  const hp = Number(packet?.delta?.hp || 0);

  Object.entries(res).forEach(([key, value]) => {
    if (!value) return;
    const dir = value > 0 ? "올라" : "떨어";
    notes.push(`${labelOf(key)} 수치가 ${Math.abs(value)}만큼 ${dir} 다음 선택의 기준이 달라졌다.`);
  });

  Object.entries(rel).forEach(([key, value]) => {
    if (!value) return;
    notes.push(`${labelOf(key)} 흐름이 ${formatDelta(value)} 변하며 인물 간 힘의 균형이 틀어졌다.`);
  });

  if (hp !== 0) {
    notes.push(`체력 변화(${formatDelta(hp)})가 생겨 위험 감수 범위가 재조정됐다.`);
  }

  if (packet?.event?.tier === "T3") notes.push("핵심 분기(T3)라 지금 선택이 이후 서사 결을 고정한다.");
  if (packet?.event?.tier === "T2") notes.push("중간 분기(T2)라 지연 시 자동 선택 규칙이 개입한다.");

  if (packet?.phase === "rest") notes.push("휴식 구간이라 회복과 경계 완화가 우선 적용됐다.");
  if (packet?.phase === "combat") notes.push("충돌 구간이라 생존과 소모 효율이 관계 감정보다 앞섰다.");

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
