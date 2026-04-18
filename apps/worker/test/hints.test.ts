import { isHintTruthful } from "@tong/shared/utils";
import { generateHintPack } from "../src/game/hints";
import { createStartedRoomState } from "./helpers";

describe("hints", () => {
  it("생성된 힌트는 실제 데이터 기준으로 모두 참이다", () => {
    const { state } = createStartedRoomState("HINT:1");
    const pack = generateHintPack("HINT:1", Object.values(state.players), state.stockDeltaMatrix);
    expect(Object.keys(pack.hints)).not.toHaveLength(0);
    for (const hint of Object.values(pack.hints)) {
      expect(isHintTruthful(hint.proof, { stockDeltaMatrix: state.stockDeltaMatrix })).toBe(true);
    }
  });

  it("중복 문장 없이 public/private 배분이 충분하다", () => {
    const { state } = createStartedRoomState("HINT:2");
    const pack = generateHintPack("HINT:2", Object.values(state.players), state.stockDeltaMatrix);
    const contents = Object.values(pack.hints).map((hint) => hint.content);
    expect(new Set(contents).size).toBe(contents.length);
    expect(pack.publicOverallHintId).toBeTruthy();
    expect(Object.keys(pack.privateOverallHintIdsByPlayer)).toHaveLength(2);
    expect(Object.keys(pack.publicRoundHintIdsByRound)).toHaveLength(10);
  });

  it("private overall 힌트는 최종 정확값 대신 경로형 힌트를 우선 사용한다", () => {
    const { state } = createStartedRoomState("HINT:3");
    const pack = generateHintPack("HINT:3", Object.values(state.players), state.stockDeltaMatrix);
    const overallPrivateHints = Object.values(pack.hints).filter(
      (hint) => hint.audience === "private" && hint.phaseType === "overall",
    );

    expect(overallPrivateHints.every((hint) => hint.proof.kind !== "final_stock_exact_change")).toBe(true);
  });
});
