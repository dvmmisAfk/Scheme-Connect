import { ATTRIBUTES, SCHEME_BY_ID, SCHEMES } from '@/data';
import { buildChunks } from '@/data/buildChunks';
import chunksJson from '@/data/chunks.json';
import { bucketFor } from './buckets';
import { derive } from './derive';
import { ruleAttrs } from './evaluate';
import { estimateRemaining, explainSkips, nextQuestion } from './nextQuestion';
import { PERSONAS } from './personas';
import { DEFAULT_WEIGHTS, rank } from './rank';
import { screen } from './screen';
import type { Answers } from './types';

describe('derive', () => {
  it('govt_employee follows occupation', () => {
    expect(derive({ occupation: 'govt_employee' }).govt_employee).toBe(true);
    expect(derive({ occupation: 'farmer' }).govt_employee).toBe(false);
  });
  it('unorganised_worker by occupation', () => {
    for (const o of ['farmer', 'street_vendor', 'artisan', 'daily_wage']) expect(derive({ occupation: o }).unorganised_worker).toBe(true);
    for (const o of ['govt_employee', 'private_salaried', 'student', 'homemaker', 'retired']) expect(derive({ occupation: o }).unorganised_worker).toBe(false);
    expect(derive({ occupation: 'other' }).unorganised_worker).toBeUndefined();
    expect(derive({ occupation: 'other', unorganised_worker: true }).unorganised_worker).toBe(true);
  });
  it('vishwakarma_trade only for artisans', () => {
    expect(derive({ occupation: 'farmer' }).vishwakarma_trade).toBe('none');
    expect(derive({ occupation: 'artisan' }).vishwakarma_trade).toBeUndefined();
    expect(derive({ occupation: 'artisan', vishwakarma_trade: 'potter' }).vishwakarma_trade).toBe('potter');
  });
  it('unknown occupation leaves derived attributes unknown', () => {
    const p = derive({ occupation: null, govt_employee: true });
    expect(p.govt_employee).toBeUndefined();
    expect(p.unorganised_worker).toBeUndefined();
    expect(p.vishwakarma_trade).toBeUndefined();
  });
  it('"don\'t know" (null) becomes unknown', () => {
    expect('bpl' in derive({ bpl: null })).toBe(false);
  });
});

describe('data integrity', () => {
  const attrIds = new Set(ATTRIBUTES.map((a) => a.id));
  it('every rule attribute is defined', () => {
    for (const s of SCHEMES) for (const a of ruleAttrs(s.rule)) expect(attrIds, `${s.id}: ${a}`).toContain(a);
  });
  it('every scheme has a source and a last_verified field', () => {
    for (const s of SCHEMES) {
      expect(s.source_url).toMatch(/^https:\/\//);
      expect(s).toHaveProperty('last_verified');
    }
  });
  it('income buckets line up with rule thresholds', () => {
    const inc = ATTRIBUTES.find((a) => a.id === 'annual_family_income')!.options!.map((o) => o.value);
    expect(inc).toEqual([80000, 200000, 400000, 800000, null]);
    const mon = ATTRIBUTES.find((a) => a.id === 'monthly_income')!.options!.map((o) => o.value);
    expect(mon).toEqual([8000, 13000, 20000, null]);
  });
  it('every persona gets the same results when incomes are asked as buckets', () => {
    for (const p of PERSONAS) {
      const bucketed: Answers = { ...p.answers };
      for (const k of ['annual_family_income', 'monthly_income']) {
        const v = bucketed[k];
        if (typeof v === 'number') bucketed[k] = bucketFor(k, v);
      }
      expect(screen(bucketed).map((r) => r.status), p.id).toEqual(screen(p.answers).map((r) => r.status));
    }
  });
  it('chunks.json is up to date (run: npx tsx scripts/build-chunks.ts)', () => {
    expect(chunksJson).toEqual(JSON.parse(JSON.stringify(buildChunks(SCHEMES))));
  });
});

describe('nextQuestion', () => {
  it('asks the seeds first, in order', () => {
    const order: string[] = [];
    let a: Answers = {};
    for (let i = 0; i < 4; i++) {
      const q = nextQuestion(a)!;
      order.push(q.attr);
      a = { ...a, [q.attr]: null };
    }
    expect(order).toEqual(['state', 'age', 'gender', 'area']);
  });

  it('then asks the question that touches the most undecided schemes', () => {
    const q = nextQuestion({ state: 'MP', age: 30, gender: 'female', area: 'rural' })!;
    expect(q.affectsCount).toBeGreaterThan(0);
    expect(q.affectedSchemes).toHaveLength(q.affectsCount);
  });

  it('never asks a question that cannot change a result', () => {
    // Male: PMUY is ruled out, so has_lpg_connection must never be asked.
    let a: Answers = { state: 'MP', age: 30, gender: 'male', area: 'urban' };
    const asked: string[] = [];
    for (let i = 0; i < 40; i++) {
      const q = nextQuestion(a);
      if (!q || q.final) break;
      asked.push(q.attr);
      a = { ...a, [q.attr]: null };
    }
    expect(asked).not.toContain('has_lpg_connection');
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('reports skipped questions with the deciding condition', () => {
    const skips = explainSkips({ state: 'MP', age: 30, gender: 'male', area: 'urban' });
    const lpg = skips.find((s) => s.attr === 'has_lpg_connection')!;
    expect(lpg.decidedBy).toEqual([expect.objectContaining({ scheme: 'pmuy', value: 'F' })]);
    expect(lpg.decidedBy[0]!.leaf!.attr).toBe('gender');
  });

  it('asks vishwakarma_trade only for artisans', () => {
    const run = (occupation: string) => {
      let a: Answers = { state: 'MP', age: 30, gender: 'male', area: 'urban', occupation };
      const asked: string[] = [];
      for (let i = 0; i < 40; i++) {
        const q = nextQuestion(a);
        if (!q || q.final) break;
        asked.push(q.attr);
        a = { ...a, [q.attr]: null };
      }
      return asked;
    };
    expect(run('artisan')).toContain('vishwakarma_trade');
    expect(run('farmer')).not.toContain('vishwakarma_trade');
  });

  it('ends with the optional "already receiving" step, then null', () => {
    const p2 = PERSONAS.find((p) => p.id === 'P2')!.answers;
    let a: Answers = { ...p2 };
    for (let i = 0; i < 40; i++) {
      const q = nextQuestion(a);
      if (!q || q.final) break;
      a = { ...a, [q.attr]: null };
    }
    const q = nextQuestion(a)!;
    expect(q.final).toBe(true);
    expect(q.attr).toBe('already_receiving');
    expect(nextQuestion({ ...a, already_receiving: [] })).toBeNull();
  });

  it('P8: the remaining questions are exactly what decides the possibly-eligible schemes', () => {
    const p8 = PERSONAS.find((p) => p.id === 'P8')!.answers;
    const q = nextQuestion(p8)!;
    expect(['bpl', 'has_lpg_connection', 'annual_family_income']).toContain(q.attr);
    expect(estimateRemaining(p8)).toBeGreaterThan(0);
  });
});

describe('screen + already receiving', () => {
  it('marks an eligible scheme as already when listed', () => {
    const p1 = PERSONAS.find((p) => p.id === 'P1')!.answers;
    const r = screen({ ...p1, already_receiving: ['pm-kisan'] });
    expect(r.find((x) => x.scheme.id === 'pm-kisan')!.status).toBe('already');
  });
  it('gives the first failed condition as the reason for "not"', () => {
    const p6 = PERSONAS.find((p) => p.id === 'P6')!.answers;
    const r = screen(p6).find((x) => x.scheme.id === 'pm-kisan')!;
    expect(r.status).toBe('not');
    expect(r.reason!.attr).toBe('occupation');
  });
});

describe('rank', () => {
  const p2 = PERSONAS.find((p) => p.id === 'P2')!.answers;
  const eligible = () => screen(p2).filter((r) => r.status === 'eligible');

  it('scores S = 0.4·V̂ + 0.3·M + 0.2·D − 0.1·A', () => {
    const [top] = rank(eligible(), { needs: ['health'] });
    expect(top!.scheme.id).toBe('pm-jay');
    expect(top!.score).toBeCloseTo(0.4 * 1 + 0.3 * 1, 6); // highest value + matches need
  });
  it('null value counts as 0.3', () => {
    const r = rank(eligible()).find((x) => x.scheme.id === 'ssy')!;
    expect(r.parts.V).toBe(0.3);
  });
  it('closed schemes sort after open ones', () => {
    const ranked = rank(eligible(), { needs: ['money_monthly'] });
    expect(ranked.at(-1)!.scheme.id).toBe('ladli-behna');
  });
  it('a deadline within 30 days adds D', () => {
    const r = screen(p2, [{ ...SCHEME_BY_ID['ssy']!, deadline: '2026-12-10' }]);
    const [x] = rank(r, { today: new Date('2026-11-25') });
    expect(x!.parts.D).toBe(1);
  });
  it('weights are adjustable', () => {
    const r = rank(eligible(), { weights: { ...DEFAULT_WEIGHTS, value: 0 } });
    expect(r.every((x) => x.score === 0)).toBe(true);
  });
});
