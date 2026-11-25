import { SCHEMES } from '@/data';
import { derive } from './derive';
import { evaluate } from './evaluate';
import type { Answers, Scheme, ScreenResult, ScreenStatus } from './types';

export function screenOne(scheme: Scheme, answers: Answers, profile = derive(answers)): ScreenResult {
  const r = evaluate(scheme.rule, profile);
  const already = Array.isArray(answers.already_receiving) && answers.already_receiving.includes(scheme.id);
  const status: ScreenStatus = r.value === 'T' ? (already ? 'already' : 'eligible') : r.value === 'U' ? 'possibly' : 'not';
  return {
    scheme,
    status,
    value: r.value,
    satisfied: r.satisfied,
    failed: r.failed,
    missing: r.missing,
    reason: r.value === 'F' ? (r.failed[0] ?? null) : null,
  };
}

/** Screen every scheme. Order follows the catalogue; use rank() for display order. */
export function screen(answers: Answers, schemes: Scheme[] = SCHEMES): ScreenResult[] {
  const profile = derive(answers);
  return schemes.map((s) => screenOne(s, answers, profile));
}

export function groupResults(results: ScreenResult[]) {
  return {
    eligible: results.filter((r) => r.status === 'eligible'),
    possibly: results.filter((r) => r.status === 'possibly'),
    already: results.filter((r) => r.status === 'already'),
    not: results.filter((r) => r.status === 'not'),
  };
}
