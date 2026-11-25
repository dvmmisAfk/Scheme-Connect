import { evaluate } from './evaluate';
import type { Leaf, Profile, RuleNode, Tri } from './types';

const lbl = { en: '', hi: '' };
const leaf = (attr: string): Leaf => ({ attr, op: 'is_true', label: lbl });
const profileFor = (vals: Record<string, Tri>): Profile =>
  Object.fromEntries(Object.entries(vals).filter(([, v]) => v !== 'U').map(([k, v]) => [k, v === 'T']));

const TRI: Tri[] = ['T', 'F', 'U'];

describe('Kleene ALL', () => {
  const truth: Record<string, Tri> = { TT: 'T', TF: 'F', TU: 'U', FT: 'F', FF: 'F', FU: 'F', UT: 'U', UF: 'F', UU: 'U' };
  for (const a of TRI) for (const b of TRI) {
    it(`${a} ∧ ${b} = ${truth[a + b]}`, () => {
      expect(evaluate({ all: [leaf('a'), leaf('b')] }, profileFor({ a, b })).value).toBe(truth[a + b]);
    });
  }
  it('empty ALL is T', () => expect(evaluate({ all: [] }, {}).value).toBe('T'));
});

describe('Kleene ANY', () => {
  const truth: Record<string, Tri> = { TT: 'T', TF: 'T', TU: 'T', FT: 'T', FF: 'F', FU: 'U', UT: 'T', UF: 'U', UU: 'U' };
  for (const a of TRI) for (const b of TRI) {
    it(`${a} ∨ ${b} = ${truth[a + b]}`, () => {
      expect(evaluate({ any: [leaf('a'), leaf('b')] }, profileFor({ a, b })).value).toBe(truth[a + b]);
    });
  }
  it('empty ANY is F', () => expect(evaluate({ any: [] }, {}).value).toBe('F'));
});

describe('Kleene NOT', () => {
  it('¬T = F', () => expect(evaluate({ not: leaf('a') }, { a: true }).value).toBe('F'));
  it('¬F = T', () => expect(evaluate({ not: leaf('a') }, { a: false }).value).toBe('T'));
  it('¬U = U', () => expect(evaluate({ not: leaf('a') }, {}).value).toBe('U'));
  it('swaps satisfied and failed', () => {
    const r = evaluate({ not: leaf('a') }, { a: true });
    expect(r.failed.map((l) => l.attr)).toEqual(['a']);
    expect(r.satisfied).toEqual([]);
  });
});

describe('leaf operators', () => {
  const L = (op: Leaf['op'], value?: Leaf['value']): RuleNode => ({ attr: 'x', op, value, label: lbl });
  const v = (n: RuleNode, x: unknown) => evaluate(n, x === undefined ? {} : { x: x as never }).value;
  it('eq / neq', () => {
    expect(v(L('eq', 'a'), 'a')).toBe('T');
    expect(v(L('eq', 'a'), 'b')).toBe('F');
    expect(v(L('neq', 'a'), 'b')).toBe('T');
  });
  it('in', () => {
    expect(v(L('in', ['a', 'b']), 'b')).toBe('T');
    expect(v(L('in', ['a', 'b']), 'c')).toBe('F');
  });
  it('lt / lte / gt / gte', () => {
    expect(v(L('lt', 5), 4)).toBe('T');
    expect(v(L('lt', 5), 5)).toBe('F');
    expect(v(L('lte', 5), 5)).toBe('T');
    expect(v(L('gt', 5), 5)).toBe('F');
    expect(v(L('gte', 5), 5)).toBe('T');
  });
  it('between is inclusive', () => {
    expect(v(L('between', [18, 40]), 18)).toBe('T');
    expect(v(L('between', [18, 40]), 40)).toBe('T');
    expect(v(L('between', [18, 40]), 41)).toBe('F');
    expect(v(L('between', [18, 40]), 17)).toBe('F');
  });
  it('is_true / is_false', () => {
    expect(v(L('is_true'), true)).toBe('T');
    expect(v(L('is_true'), false)).toBe('F');
    expect(v(L('is_false'), false)).toBe('T');
  });
  it('a missing attribute is U for every operator', () => {
    for (const op of ['eq', 'neq', 'in', 'lt', 'lte', 'gt', 'gte', 'between', 'is_true', 'is_false'] as const) {
      expect(v(L(op, op === 'between' ? [1, 2] : op === 'in' ? ['a'] : 1), undefined)).toBe('U');
    }
  });
});

describe('missing', () => {
  it('comes from U children only, deduplicated', () => {
    const r = evaluate({ all: [leaf('a'), leaf('b'), { any: [leaf('b'), leaf('c')] }] }, { a: true });
    expect(r.value).toBe('U');
    expect(r.missing.sort()).toEqual(['b', 'c']);
  });
  it('a decided ANY contributes nothing', () => {
    const r = evaluate({ all: [leaf('a'), { any: [leaf('b'), leaf('c')] }] }, { b: true });
    expect(r.missing).toEqual(['a']);
  });
});
