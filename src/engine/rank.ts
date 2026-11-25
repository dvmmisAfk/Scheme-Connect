import { SCHEMES } from '@/data';
import type { Need, Scheme, ScreenResult } from './types';

export interface Weights {
  value: number;
  match: number;
  deadline: number;
  already: number;
}

export const DEFAULT_WEIGHTS: Weights = { value: 0.4, match: 0.3, deadline: 0.2, already: 0.1 };

/** V̂ for a scheme with no known value. */
export const NULL_VALUE_SCORE = 0.3;

export interface RankContext {
  needs?: Need[];
  weights?: Weights;
  /** "Today" for the deadline check; injectable for tests. */
  today?: Date;
  /** Schemes whose values define v_max. Defaults to the whole catalogue so scores don't shift with filters. */
  catalogue?: Scheme[];
}

export interface Ranked extends ScreenResult {
  score: number;
  parts: { V: number; M: number; D: number; A: number };
}

const DAY = 86_400_000;

/** S = w_v·V̂ + w_m·M + w_d·D − w_a·A */
export function scoreOf(r: ScreenResult, ctx: RankContext = {}): Ranked {
  const w = ctx.weights ?? DEFAULT_WEIGHTS;
  const cat = ctx.catalogue ?? SCHEMES;
  const vmax = Math.max(0, ...cat.map((s) => s.value ?? 0));
  const v = r.scheme.value;
  const V = v === null ? NULL_VALUE_SCORE : vmax > 0 ? Math.log(1 + v) / Math.log(1 + vmax) : 0;
  const M = r.scheme.need && ctx.needs?.includes(r.scheme.need) ? 1 : 0;
  const today = ctx.today ?? new Date();
  let D = 0;
  if (r.scheme.deadline) {
    const days = (new Date(r.scheme.deadline).getTime() - today.getTime()) / DAY;
    D = days >= 0 && days <= 30 ? 1 : 0;
  }
  const A = r.status === 'already' ? 1 : 0;
  const score = w.value * V + w.match * M + w.deadline * D - w.already * A;
  return { ...r, score, parts: { V, M, D, A } };
}

/** Highest score first. Closed schemes sort after open ones (only matters inside Eligible). */
export function rank(results: ScreenResult[], ctx: RankContext = {}): Ranked[] {
  return results
    .map((r) => scoreOf(r, ctx))
    .sort((a, b) => {
      const ca = a.scheme.enrolment_status === 'closed' ? 1 : 0;
      const cb = b.scheme.enrolment_status === 'closed' ? 1 : 0;
      if (ca !== cb) return ca - cb;
      return b.score - a.score || a.scheme.id.localeCompare(b.scheme.id);
    });
}
