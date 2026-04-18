import { generateStockDeltaMatrix, validateGeneratedMatrix } from "../src/game/generator";

describe("generator", () => {
  it("같은 seed면 같은 경로를 만든다", () => {
    const first = generateStockDeltaMatrix("ROOM:123");
    const second = generateStockDeltaMatrix("ROOM:123");
    expect(first.stockDeltaMatrix).toEqual(second.stockDeltaMatrix);
    expect(first.priceHistory).toEqual(second.priceHistory);
  });

  it("생성 결과가 제약을 만족한다", () => {
    const generated = generateStockDeltaMatrix("ROOM:456");
    expect(validateGeneratedMatrix(generated.stockDeltaMatrix)).toBe(true);
  });
});
