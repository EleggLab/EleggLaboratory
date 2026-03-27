import { relations as relationsData } from '@saju/data';
import type { Branch, RelationHit, Stem } from '../types';

function normalizedPair(a: string, b: string): string {
  return [a, b].sort().join('-');
}

export function detectRelations(branches: Branch[], stems: Stem[]): RelationHit[] {
  const hits: RelationHit[] = [];

  const branchSet = new Set(branches);
  const stemSet = new Set(stems);

  const clashes = (relationsData.clash as [Branch, Branch][])
    .filter(([a, b]) => branchSet.has(a) && branchSet.has(b))
    .map(([a, b]) => normalizedPair(a, b));

  if (clashes.length > 0) {
    hits.push({ kind: 'clash', labels: ['충'], matched: clashes });
  }

  const stemCombine = (relationsData.stemCombine as [Stem, Stem][])
    .filter(([a, b]) => stemSet.has(a) && stemSet.has(b))
    .map(([a, b]) => normalizedPair(a, b));

  if (stemCombine.length > 0) {
    hits.push({ kind: 'stemCombine', labels: ['천간합'], matched: stemCombine });
  }

  const branchSixCombine = (relationsData.branchSixCombine as [Branch, Branch][])
    .filter(([a, b]) => branchSet.has(a) && branchSet.has(b))
    .map(([a, b]) => normalizedPair(a, b));

  if (branchSixCombine.length > 0) {
    hits.push({ kind: 'branchSixCombine', labels: ['지지육합'], matched: branchSixCombine });
  }

  const threeHarmony = (
    relationsData.threeHarmony as unknown as Array<{ branches: [Branch, Branch, Branch]; label: string }>
  )
    .filter(({ branches: set }) => set.every((value) => branchSet.has(value)))
    .map((entry) => entry.label);

  if (threeHarmony.length > 0) {
    hits.push({ kind: 'threeHarmony', labels: ['삼합'], matched: threeHarmony });
  }

  const harms = ((relationsData as any).harm as [Branch, Branch][] | undefined)
    ?.filter(([a, b]) => branchSet.has(a) && branchSet.has(b))
    .map(([a, b]) => normalizedPair(a, b));

  if (harms && harms.length > 0) {
    hits.push({ kind: 'harm', labels: ['해'], matched: harms });
  }

  const breaks = ((relationsData as any).break as [Branch, Branch][] | undefined)
    ?.filter(([a, b]) => branchSet.has(a) && branchSet.has(b))
    .map(([a, b]) => normalizedPair(a, b));

  if (breaks && breaks.length > 0) {
    hits.push({ kind: 'break', labels: ['파'], matched: breaks });
  }

  const punishments = ((relationsData as any).punishment as Branch[][] | undefined)
    ?.filter((set) => set.every((value) => branchSet.has(value)))
    .map((set) => set.join('-'));

  if (punishments && punishments.length > 0) {
    hits.push({ kind: 'punishment', labels: ['형'], matched: punishments });
  }

  return hits;
}
