import { detectRelations } from '../src/ganji/relations';

describe('relations', () => {
  it('detects clash and harmony sets', () => {
    const result = detectRelations(['자', '오', '신', '진'], ['갑', '기', '임']);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'clash' }),
        expect.objectContaining({ kind: 'threeHarmony' }),
        expect.objectContaining({ kind: 'stemCombine' }),
      ]),
    );
  });

  it('detects harm/break/punishment', () => {
    const result = detectRelations(['자', '미', '유', '묘', '인', '사', '신'], ['갑', '을']);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'harm' }),
        expect.objectContaining({ kind: 'break' }),
        expect.objectContaining({ kind: 'punishment' }),
      ]),
    );
  });
});
