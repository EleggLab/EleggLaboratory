import { explainFeature } from '../src/explain/templates';

describe('explainFeature', () => {
  it('returns FAQ snippet by id', () => {
    const result = explainFeature('faq-ten-gods');
    expect(result).toBeDefined();
    expect(result?.id).toBe('faq-ten-gods');
    expect(result?.sourceUrls.length).toBeGreaterThan(0);
  });

  it('resolves day-pillar archetype by context', () => {
    const result = explainFeature('not-found', { dayPillar: '갑자' });
    expect(result).toBeDefined();
    expect(result?.id).toContain('갑자');
  });
});
