import type { BirthInput, SajuChartResult } from '../types';
import { computeDaeunCycles } from '../luck/daeun';
import { computeSaeunCycles } from '../luck/saeun';
import { computeFourPillars } from './computeFourPillars';
import { deriveFeatures } from './deriveFeatures';

export function computeSajuChart(input: BirthInput): SajuChartResult {
  const fourPillars = computeFourPillars(input);
  const features = deriveFeatures(fourPillars);
  const daeun = computeDaeunCycles(fourPillars);
  const annualCycles = computeSaeunCycles(fourPillars);

  return {
    fourPillars,
    features,
    luck: {
      ...daeun,
      annualCycles,
    },
  };
}
