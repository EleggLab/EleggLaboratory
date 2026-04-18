import type { Stem, TenGod } from '../src/types';
import { getTenGod } from '../src/ganji/tenGods';

const stems: Stem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

describe('ten gods', () => {
  it('matches fixed mapping for 갑 day master', () => {
    const expected: Record<Stem, TenGod> = {
      갑: '비견',
      을: '겁재',
      병: '식신',
      정: '상관',
      무: '편재',
      기: '정재',
      경: '편관',
      신: '정관',
      임: '편인',
      계: '정인',
    };

    for (const stem of stems) {
      expect(getTenGod('갑', stem)).toBe(expected[stem]);
    }
  });

  it('freezes full 10x10 matrix snapshot', () => {
    const matrix = stems.map((dm) => ({
      dm,
      row: stems.map((target) => `${target}:${getTenGod(dm, target)}`),
    }));

    expect(matrix).toMatchSnapshot();
  });
});
