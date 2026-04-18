import {
  ROUND_COUNT,
  START_PRICE,
  STOCK_DEFINITIONS,
} from "@tong/shared/config";
import type { StockId } from "@tong/shared/types";
import {
  buildEffectiveRoundChanges,
  buildPriceHistoryFromMatrix,
  createSeededRng,
  randomInt,
} from "@tong/shared/utils";
import { createEmptyMatrix } from "../utils/state";

export interface GeneratedMarket {
  stockDeltaMatrix: Record<StockId, number[]>;
  priceHistory: Record<StockId, number[]>;
  effectiveRoundChanges: Record<StockId, number[]>;
}

export function validateGeneratedMatrix(stockDeltaMatrix: Record<StockId, number[]>): boolean {
  const priceHistory = buildPriceHistoryFromMatrix(stockDeltaMatrix);
  const effectiveRoundChanges = buildEffectiveRoundChanges(stockDeltaMatrix);
  const finalPrices = STOCK_DEFINITIONS.map(
    (stock) => priceHistory[stock.id][priceHistory[stock.id].length - 1] ?? START_PRICE,
  );
  const aboveStart = finalPrices.filter((price) => price > START_PRICE).length;
  const belowStart = finalPrices.filter((price) => price < START_PRICE).length;

  if (aboveStart < 2 || belowStart < 2) {
    return false;
  }

  for (let roundIndex = 0; roundIndex < ROUND_COUNT; roundIndex += 1) {
    const roundChanges = STOCK_DEFINITIONS.map(
      (stock) => effectiveRoundChanges[stock.id][roundIndex] ?? 0,
    );
    if (!roundChanges.some((value) => value > 0) || !roundChanges.some((value) => value < 0)) {
      return false;
    }
  }

  for (const stock of STOCK_DEFINITIONS) {
    const changes = effectiveRoundChanges[stock.id];
    if (!changes.some((value) => value > 0) || !changes.some((value) => value < 0)) {
      return false;
    }
  }

  return true;
}

export function generateStockDeltaMatrix(seed: string): GeneratedMarket {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const rng = createSeededRng(`${seed}:matrix:${attempt}`);
    const stockDeltaMatrix = createEmptyMatrix();

    for (let roundIndex = 0; roundIndex < ROUND_COUNT; roundIndex += 1) {
      const roundDeltas = STOCK_DEFINITIONS.map(() => randomInt(rng, -3, 3));
      if (!roundDeltas.some((value) => value > 0)) {
        roundDeltas[randomInt(rng, 0, roundDeltas.length - 1)] = randomInt(rng, 1, 3);
      }
      if (!roundDeltas.some((value) => value < 0)) {
        let targetIndex = randomInt(rng, 0, roundDeltas.length - 1);
        if ((roundDeltas[targetIndex] ?? 0) > 0) {
          targetIndex = (targetIndex + 1) % roundDeltas.length;
        }
        roundDeltas[targetIndex] = -randomInt(rng, 1, 3);
      }

      for (let stockIndex = 0; stockIndex < STOCK_DEFINITIONS.length; stockIndex += 1) {
        const stockId = STOCK_DEFINITIONS[stockIndex]!.id;
        stockDeltaMatrix[stockId].push(roundDeltas[stockIndex]!);
      }
    }

    if (validateGeneratedMatrix(stockDeltaMatrix)) {
      return {
        stockDeltaMatrix,
        priceHistory: buildPriceHistoryFromMatrix(stockDeltaMatrix),
        effectiveRoundChanges: buildEffectiveRoundChanges(stockDeltaMatrix),
      };
    }
  }

  throw new Error("주가 경로를 만들지 못했습니다.");
}
