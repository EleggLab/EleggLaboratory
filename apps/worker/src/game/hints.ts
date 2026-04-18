import {
  ROUND_COUNT,
  START_PRICE,
  STOCK_DEFINITIONS,
  TAG_DEFINITIONS,
} from "@tong/shared/config";
import type {
  Hint,
  HintProof,
  InfoType,
  PhaseType,
  Player,
  StockId,
  TagId,
  TargetType,
} from "@tong/shared/types";
import {
  buildEffectiveRoundChanges,
  buildPriceHistoryFromMatrix,
  createId,
  getTagStockIds,
  isHintTruthful,
  shuffleDeterministic,
} from "@tong/shared/utils";

interface HintCandidate {
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  roundNumber: number | null;
  content: string;
  proof: HintProof;
}

export interface HintPack {
  hints: Record<string, Hint>;
  publicOverallHintId: string;
  privateOverallHintIdsByPlayer: Record<string, string>;
  publicRoundHintIdsByRound: Record<number, string>;
  privateRoundHintIdsByRound: Record<number, Record<string, string>>;
}

function createCandidate(
  phaseType: PhaseType,
  targetType: TargetType,
  infoType: InfoType,
  roundNumber: number | null,
  content: string,
  proof: HintProof,
): HintCandidate {
  return { phaseType, targetType, infoType, roundNumber, content, proof };
}

function finalChange(priceHistory: Record<StockId, number[]>, stockId: StockId): number {
  return (priceHistory[stockId][priceHistory[stockId].length - 1] ?? START_PRICE) - START_PRICE;
}

function buildOverallCandidates(stockDeltaMatrix: Record<StockId, number[]>): {
  publicCandidates: HintCandidate[];
  privateCandidates: HintCandidate[];
} {
  const priceHistory = buildPriceHistoryFromMatrix(stockDeltaMatrix);
  const publicCandidates: HintCandidate[] = [];
  const privateCandidates: HintCandidate[] = [];

  for (const stock of STOCK_DEFINITIONS) {
    const change = finalChange(priceHistory, stock.id);
    const stockPrices = priceHistory[stock.id];
    const maxPrice = Math.max(...stockPrices);
    const minPrice = Math.min(...stockPrices);
    if (change > 0) {
      publicCandidates.push(
        createCandidate("overall", "single", "up", null, `${stock.name}의 최종가는 시작가보다 높다.`, {
          kind: "final_stock_direction",
          stockId: stock.id,
          direction: "up",
        }),
      );
    }
    if (change < 0) {
      publicCandidates.push(
        createCandidate("overall", "single", "down", null, `${stock.name}의 최종가는 시작가보다 낮다.`, {
          kind: "final_stock_direction",
          stockId: stock.id,
          direction: "down",
        }),
      );
    }

    if (maxPrice >= START_PRICE + 1) {
      const upwardThresholds = [...new Set([START_PRICE + 1, START_PRICE + 2, maxPrice])]
        .filter((price) => price >= START_PRICE + 1 && price <= maxPrice)
        .sort((left, right) => left - right);

      for (const threshold of upwardThresholds) {
        privateCandidates.push(
          createCandidate(
            "overall",
            "single",
            "exact",
            null,
            `${stock.name}는 게임 중 한 번 이상 ${threshold}코인 이상에 도달한다.`,
            {
              kind: "stock_reaches_price_at_least",
              stockId: stock.id,
              price: threshold,
            },
          ),
        );
      }
    }

    if (minPrice <= START_PRICE - 1) {
      const downwardThresholds = [...new Set([START_PRICE - 1, START_PRICE - 2, minPrice])]
        .filter((price) => price <= START_PRICE - 1 && price >= minPrice)
        .sort((left, right) => right - left);

      for (const threshold of downwardThresholds) {
        privateCandidates.push(
          createCandidate(
            "overall",
            "single",
            "exact",
            null,
            `${stock.name}는 게임 중 한 번 이상 ${threshold}코인 이하로 내려간다.`,
            {
              kind: "stock_reaches_price_at_most",
              stockId: stock.id,
              price: threshold,
            },
          ),
        );
      }
    }
  }

  for (const tagId of TAG_DEFINITIONS) {
    const net = getTagStockIds(tagId).reduce((sum, stockId) => sum + finalChange(priceHistory, stockId), 0);
    if (net > 0) {
      const candidate = createCandidate(
        "overall",
        "tag",
        "up",
        null,
        `${tagId} 태그 종목의 최종가 총합은 시작 총합보다 높다.`,
        {
          kind: "final_tag_direction",
          tagId,
          direction: "up",
        },
      );
      publicCandidates.push(candidate);
      privateCandidates.push(candidate);
    }
    if (net < 0) {
      const candidate = createCandidate(
        "overall",
        "tag",
        "down",
        null,
        `${tagId} 태그 종목의 최종가 총합은 시작 총합보다 낮다.`,
        {
          kind: "final_tag_direction",
          tagId,
          direction: "down",
        },
      );
      publicCandidates.push(candidate);
      privateCandidates.push(candidate);
    }
  }

  for (let leftIndex = 0; leftIndex < STOCK_DEFINITIONS.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < STOCK_DEFINITIONS.length; rightIndex += 1) {
      const left = STOCK_DEFINITIONS[leftIndex]!;
      const right = STOCK_DEFINITIONS[rightIndex]!;
      const leftFinal = priceHistory[left.id][priceHistory[left.id].length - 1] ?? START_PRICE;
      const rightFinal = priceHistory[right.id][priceHistory[right.id].length - 1] ?? START_PRICE;
      if (leftFinal > rightFinal) {
        const candidate = createCandidate(
          "overall",
          "single",
          "compare",
          null,
          `최종가 기준으로 ${left.name}는 ${right.name}보다 높다.`,
          {
            kind: "final_compare",
            leftStockId: left.id,
            rightStockId: right.id,
            relation: "gt",
          },
        );
        publicCandidates.push(candidate);
        privateCandidates.push(candidate);
      } else if (leftFinal < rightFinal) {
        const candidate = createCandidate(
          "overall",
          "single",
          "compare",
          null,
          `최종가 기준으로 ${left.name}는 ${right.name}보다 낮다.`,
          {
            kind: "final_compare",
            leftStockId: left.id,
            rightStockId: right.id,
            relation: "lt",
          },
        );
        publicCandidates.push(candidate);
        privateCandidates.push(candidate);
      }
    }
  }

  return { publicCandidates, privateCandidates };
}

function buildRoundCandidates(
  stockDeltaMatrix: Record<StockId, number[]>,
  roundNumber: number,
): { publicCandidates: HintCandidate[]; privateCandidates: HintCandidate[] } {
  const effectiveRoundChanges = buildEffectiveRoundChanges(stockDeltaMatrix);
  const publicCandidates: HintCandidate[] = [];
  const privateCandidates: HintCandidate[] = [];
  const roundIndex = roundNumber - 1;
  const changeOf = (stockId: StockId) => effectiveRoundChanges[stockId][roundIndex] ?? 0;

  for (const stock of STOCK_DEFINITIONS) {
    const change = changeOf(stock.id);
    if (change > 0) {
      privateCandidates.push(
        createCandidate("round", "single", "up", roundNumber, `${stock.name}는 ${roundNumber}라운드에 상승한다.`, {
          kind: "round_stock_direction",
          roundNumber,
          stockId: stock.id,
          direction: "up",
        }),
      );
    }
    if (change < 0) {
      privateCandidates.push(
        createCandidate("round", "single", "down", roundNumber, `${stock.name}는 ${roundNumber}라운드에 하락한다.`, {
          kind: "round_stock_direction",
          roundNumber,
          stockId: stock.id,
          direction: "down",
        }),
      );
    }
    if (change !== 0) {
      privateCandidates.push(
        createCandidate(
          "round",
          "single",
          "exact",
          roundNumber,
          `${stock.name}는 ${roundNumber}라운드에 정확히 ${change > 0 ? `+${change}` : change} 움직인다.`,
          {
            kind: "round_stock_exact_change",
            roundNumber,
            stockId: stock.id,
            delta: change,
          },
        ),
      );
    }
  }

  for (const tagId of TAG_DEFINITIONS) {
    const total = getTagStockIds(tagId).reduce((sum, stockId) => sum + changeOf(stockId), 0);
    if (total > 0) {
      const candidate = createCandidate("round", "tag", "up", roundNumber, `${tagId} 태그 종목의 ${roundNumber}라운드 합계 변동은 양수다.`, {
        kind: "round_tag_direction",
        roundNumber,
        tagId,
        direction: "up",
      });
      publicCandidates.push(candidate);
      privateCandidates.push(candidate);
    }
    if (total < 0) {
      const candidate = createCandidate("round", "tag", "down", roundNumber, `${tagId} 태그 종목의 ${roundNumber}라운드 합계 변동은 음수다.`, {
        kind: "round_tag_direction",
        roundNumber,
        tagId,
        direction: "down",
      });
      publicCandidates.push(candidate);
      privateCandidates.push(candidate);
    }
  }

  const risingCount = STOCK_DEFINITIONS.filter((stock) => changeOf(stock.id) > 0).length;
  const fallingCount = STOCK_DEFINITIONS.filter((stock) => changeOf(stock.id) < 0).length;
  if (risingCount > fallingCount) {
    publicCandidates.push(
      createCandidate("round", "market", "compare", roundNumber, `${roundNumber}라운드에는 상승 종목 수가 하락 종목 수보다 많다.`, {
        kind: "round_market_balance",
        roundNumber,
        relation: "more-up",
      }),
    );
  }
  if (risingCount < fallingCount) {
    publicCandidates.push(
      createCandidate("round", "market", "compare", roundNumber, `${roundNumber}라운드에는 상승 종목 수가 하락 종목 수보다 적다.`, {
        kind: "round_market_balance",
        roundNumber,
        relation: "more-down",
      }),
    );
  }

  const maxRise = Math.max(...STOCK_DEFINITIONS.map((stock) => changeOf(stock.id)));
  const maxFall = Math.min(...STOCK_DEFINITIONS.map((stock) => changeOf(stock.id)));
  if (maxRise >= 2) {
    publicCandidates.push(
      createCandidate("round", "market", "compare", roundNumber, `${roundNumber}라운드 최대 상승폭은 2 이상이다.`, {
        kind: "round_max_swing_at_least",
        roundNumber,
        direction: "up",
        magnitude: 2,
      }),
    );
  }
  if (maxFall <= -2) {
    publicCandidates.push(
      createCandidate("round", "market", "compare", roundNumber, `${roundNumber}라운드 최대 하락폭은 2 이상이다.`, {
        kind: "round_max_swing_at_least",
        roundNumber,
        direction: "down",
        magnitude: 2,
      }),
    );
  }

  for (let leftIndex = 0; leftIndex < STOCK_DEFINITIONS.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < STOCK_DEFINITIONS.length; rightIndex += 1) {
      const left = STOCK_DEFINITIONS[leftIndex]!;
      const right = STOCK_DEFINITIONS[rightIndex]!;
      const leftMagnitude = Math.abs(changeOf(left.id));
      const rightMagnitude = Math.abs(changeOf(right.id));
      if (leftMagnitude > rightMagnitude) {
        privateCandidates.push(
          createCandidate(
            "round",
            "single",
            "compare",
            roundNumber,
            `${roundNumber}라운드 ${left.name}의 변동폭은 ${right.name}보다 크다.`,
            {
              kind: "round_compare_magnitude",
              roundNumber,
              leftStockId: left.id,
              rightStockId: right.id,
              relation: "gt",
            },
          ),
        );
      } else if (leftMagnitude < rightMagnitude) {
        privateCandidates.push(
          createCandidate(
            "round",
            "single",
            "compare",
            roundNumber,
            `${roundNumber}라운드 ${left.name}의 변동폭은 ${right.name}보다 작다.`,
            {
              kind: "round_compare_magnitude",
              roundNumber,
              leftStockId: left.id,
              rightStockId: right.id,
              relation: "lt",
            },
          ),
        );
      }
    }
  }

  const sortedUp = [...STOCK_DEFINITIONS].sort((left, right) => {
    return changeOf(right.id) - changeOf(left.id) || left.id.localeCompare(right.id);
  });
  if (changeOf(sortedUp[0]!.id) > changeOf(sortedUp[1]!.id)) {
    privateCandidates.push(
      createCandidate("round", "single", "compare", roundNumber, `${sortedUp[0]!.name}는 ${roundNumber}라운드에 가장 많이 오른다.`, {
        kind: "round_stock_rank",
        roundNumber,
        stockId: sortedUp[0]!.id,
        rankType: "top-up",
      }),
    );
  }

  const sortedDown = [...STOCK_DEFINITIONS].sort((left, right) => {
    return changeOf(left.id) - changeOf(right.id) || left.id.localeCompare(right.id);
  });
  if (changeOf(sortedDown[0]!.id) < changeOf(sortedDown[1]!.id)) {
    privateCandidates.push(
      createCandidate("round", "single", "compare", roundNumber, `${sortedDown[0]!.name}는 ${roundNumber}라운드에 가장 많이 내린다.`, {
        kind: "round_stock_rank",
        roundNumber,
        stockId: sortedDown[0]!.id,
        rankType: "top-down",
      }),
    );
  }

  return { publicCandidates, privateCandidates };
}

function allocateCandidate(candidates: HintCandidate[], seed: string, usedContents: Set<string>): HintCandidate {
  const shuffled = shuffleDeterministic(candidates, seed);
  const candidate = shuffled.find((item) => !usedContents.has(item.content));
  if (!candidate) {
    throw new Error("중복 없는 힌트를 만들지 못했습니다.");
  }
  usedContents.add(candidate.content);
  return candidate;
}

function materializeHint(
  candidate: HintCandidate,
  ownerPlayerId: string | null,
  readableBy: string[],
  tradeable: boolean,
): Hint {
  return {
    id: createId("hint"),
    audience: ownerPlayerId ? "private" : "public",
    ownerPlayerId,
    phaseType: candidate.phaseType,
    targetType: candidate.targetType,
    infoType: candidate.infoType,
    roundNumber: candidate.roundNumber,
    content: candidate.content,
    tradeable,
    soldOnce: false,
    acquiredRound: null,
    readableBy,
    proof: candidate.proof,
  };
}

export function generateHintPack(
  seed: string,
  players: Player[],
  stockDeltaMatrix: Record<StockId, number[]>,
): HintPack {
  const hints: Record<string, Hint> = {};
  const usedContents = new Set<string>();
  const sortedPlayers = [...players].sort((left, right) => left.joinedAt - right.joinedAt);
  const overall = buildOverallCandidates(stockDeltaMatrix);
  const publicOverallCandidate = allocateCandidate(overall.publicCandidates, `${seed}:overall:public`, usedContents);
  const publicOverallHint = materializeHint(publicOverallCandidate, null, [], false);
  hints[publicOverallHint.id] = publicOverallHint;

  const privateOverallHintIdsByPlayer: Record<string, string> = {};
  for (const player of sortedPlayers) {
    const candidate = allocateCandidate(overall.privateCandidates, `${seed}:overall:private:${player.id}`, usedContents);
    const hint = materializeHint(candidate, player.id, [player.id], true);
    hints[hint.id] = hint;
    privateOverallHintIdsByPlayer[player.id] = hint.id;
  }

  const publicRoundHintIdsByRound: Record<number, string> = {};
  const privateRoundHintIdsByRound: Record<number, Record<string, string>> = {};

  for (let roundNumber = 1; roundNumber <= ROUND_COUNT; roundNumber += 1) {
    const roundCandidates = buildRoundCandidates(stockDeltaMatrix, roundNumber);
    const publicCandidate = allocateCandidate(
      roundCandidates.publicCandidates.length > 0 ? roundCandidates.publicCandidates : roundCandidates.privateCandidates,
      `${seed}:round:${roundNumber}:public`,
      usedContents,
    );
    const publicHint = materializeHint(publicCandidate, null, [], false);
    hints[publicHint.id] = publicHint;
    publicRoundHintIdsByRound[roundNumber] = publicHint.id;

    privateRoundHintIdsByRound[roundNumber] = {};
    for (const player of sortedPlayers) {
      const candidate = allocateCandidate(roundCandidates.privateCandidates, `${seed}:round:${roundNumber}:private:${player.id}`, usedContents);
      const hint = materializeHint(candidate, player.id, [player.id], true);
      hints[hint.id] = hint;
      privateRoundHintIdsByRound[roundNumber]![player.id] = hint.id;
    }
  }

  for (const hint of Object.values(hints)) {
    if (!isHintTruthful(hint.proof, { stockDeltaMatrix })) {
      throw new Error(`거짓 힌트가 생성되었습니다: ${hint.content}`);
    }
  }

  return {
    hints,
    publicOverallHintId: publicOverallHint.id,
    privateOverallHintIdsByPlayer,
    publicRoundHintIdsByRound,
    privateRoundHintIdsByRound,
  };
}
