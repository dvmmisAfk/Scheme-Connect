import { SCHEMES } from '@/data';
import { expectedStatus, PERSONAS } from './personas';
import { screen } from './screen';

const CORE = SCHEMES.filter((s) => s.core_test);

describe('Appendix B personas × core schemes', () => {
  it('has 8 personas and 14 core schemes', () => {
    expect(PERSONAS).toHaveLength(8);
    expect(CORE).toHaveLength(14);
  });

  const cases = PERSONAS.flatMap((p) => CORE.map((s) => ({ p, s })));

  it.each(cases.map(({ p, s }) => [p.id, s.short, p, s] as const))('%s · %s', (_pid, _sid, p, s) => {
    const r = screen(p.answers, [s])[0]!;
    expect(r.status).toBe(expectedStatus(p, s.id));
  });

  it('P8 possibly-eligible schemes report exactly the missing attributes', () => {
    const p8 = PERSONAS.find((p) => p.id === 'P8')!;
    const results = screen(p8.answers, CORE);
    for (const { id, missing } of p8.possibly) {
      const r = results.find((x) => x.scheme.id === id)!;
      expect(r.status).toBe('possibly');
      expect([...r.missing].sort()).toEqual([...missing].sort());
    }
    expect(results.filter((r) => r.status === 'possibly').map((r) => r.scheme.id).sort()).toEqual(p8.possibly.map((x) => x.id).sort());
  });

  it(`totals ${PERSONAS.length * 14} / ${PERSONAS.length * 14}`, () => {
    let pass = 0;
    for (const p of PERSONAS) for (const r of screen(p.answers, CORE)) if (r.status === expectedStatus(p, r.scheme.id)) pass++;
    expect(pass).toBe(112);
  });
});
