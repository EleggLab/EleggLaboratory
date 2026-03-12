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
    fear: "공포"
  }[key] || key;
}

function hasBatchim(word = "") {
  const ch = String(word).trim().slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withSubject(word = "") {
  return `${word}${hasBatchim(word) ? "이" : "가"}`;
}

export function generateCausalNotes(packet) {
  const notes = [];
  const res = packet?.delta?.resources || {};
  const rel = packet?.delta?.relation || {};
  const hp = Number(packet?.delta?.hp || 0);

  Object.entries(res).forEach(([key, value]) => {
    if (!value) return;
    const direction = value > 0 ? "증가" : "감소";
    const resourceName = labelOf(key);
    notes.push(`${withSubject(resourceName)} ${Math.abs(value)}만큼 ${direction}해 다음 선택의 리스크가 달라진다.`);
  });

  Object.entries(rel).forEach(([key, value]) => {
    if (!value) return;
    notes.push(`${labelOf(key)} 변화(${formatDelta(value)})가 대화 톤과 관계 분기를 흔든다.`);
  });

  if (hp !== 0) {
    notes.push(`체력 변동(${formatDelta(hp)})으로 전투/휴식 우선순위가 재조정된다.`);
  }

  if (packet?.event?.tier === "T3") notes.push("대형 분기(T3)라서 현재 선택이 장기 루트에 강하게 고정된다.");
  if (packet?.event?.tier === "T2") notes.push("중형 분기(T2)라서 빠른 대응 여부가 효율에 직접 영향을 준다.");

  if (packet?.phase === "rest") notes.push("휴식 구간이라 회복 효율과 다음 행동 안정성이 올라간다.");
  if (packet?.phase === "combat") notes.push("전투 구간이라 생존과 자원 소모 판단이 우선된다.");

  return notes.slice(0, 4);
}

export function deriveFollowupHooks(packet) {
  const hooks = [];
  const res = packet?.delta?.resources || {};

  if ((res.gold || 0) >= 8) hooks.push("장비 강화 혹은 소비 선택");
  if ((res.taint || 0) > 0 || Number(packet?.current?.taint || 0) >= 40) hooks.push("오염 누적에 따른 특수 이벤트");
  if (Number(packet?.current?.fatigue || 0) >= 55) hooks.push("휴식 우선 루트 검토");
  if ((packet?.delta?.actProgress || 0) >= 15) hooks.push("막 전환 임계치 접근");
  if (packet?.event?.tier === "T3") hooks.push("현재 분기 결과가 다음 메인 사건에 반영");

  return hooks.slice(0, 3);
}
