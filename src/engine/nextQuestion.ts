import { ATTRIBUTES, SCHEMES } from '@/data';
import { derive } from './derive';
import { evalLeafValue, evaluate, ruleLeaves } from './evaluate';
import type { Answers, Attribute, Leaf, NextQuestion, Profile, Scalar, Scheme, Tri } from './types';

const SEEDS = ATTRIBUTES.filter((a) => a.seed).map((a) => a.id);

const answered = (answers: Answers, id: string) => Object.prototype.hasOwnProperty.call(answers, id) && answers[id] !== undefined;

/** Values worth trying for an attribute: its options, or numbers around every threshold in the rules. */
export function candidateValues(attr: Attribute, schemes: Scheme[] = SCHEMES): Scalar[] {
  if (attr.options) return attr.options.map((o) => o.value).filter((v): v is Scalar => v !== null);
  if (attr.kind === 'number') {
    const pts = new Set<number>([attr.min ?? 0, attr.max ?? 100]);
    for (const s of schemes) {
      for (const l of ruleLeaves(s.rule)) {
        if (l.attr !== attr.id) continue;
        const xs = Array.isArray(l.value) ? l.value : [l.value];
        for (const x of xs) if (typeof x === 'number') [x - 1, x, x + 1].forEach((n) => pts.add(n));
      }
    }
    return [...pts];
  }
  return [];
}

/** Is this question allowed right now (its precondition is definitely true)? */
export function isAskable(attr: Attribute, answers: Answers, profile: Profile = derive(answers)): boolean {
  if (attr.derived_only || attr.kind === 'multi') return false;
  if (answered(answers, attr.id)) return false;
  if (attr.ask_if) return evalLeafValue(attr.ask_if as Leaf, profile) === 'T';
  return true;
}

export interface Impact {
  attr: string;
  affectedSchemes: string[];
}

/** For one question: which currently-undecided schemes could some answer decide (or change)? */
export function impactOf(attr: Attribute, answers: Answers, schemes: Scheme[] = SCHEMES, current?: Map<string, Tri>): Impact {
  const profile = derive(answers);
  const now = current ?? new Map(schemes.map((s) => [s.id, evaluate(s.rule, profile).value]));
  const values = candidateValues(attr, schemes);
  const affected: string[] = [];
  for (const s of schemes) {
    if (now.get(s.id) !== 'U') continue;
    for (const v of values) {
      const p = derive({ ...answers, [attr.id]: v });
      if (evaluate(s.rule, p).value !== 'U') {
        affected.push(s.id);
        break;
      }
    }
  }
  return { attr: attr.id, affectedSchemes: affected };
}

/** Every askable question ranked by how many undecided schemes it could change (ties: catalogue order). */
export function rankQuestions(answers: Answers, schemes: Scheme[] = SCHEMES): Impact[] {
  const profile = derive(answers);
  const current = new Map(schemes.map((s) => [s.id, evaluate(s.rule, profile).value]));
  return ATTRIBUTES.filter((a) => isAskable(a, answers, profile))
    .map((a) => impactOf(a, answers, schemes, current))
    .filter((i) => i.affectedSchemes.length > 0)
    .sort((a, b) => b.affectedSchemes.length - a.affectedSchemes.length);
}

/**
 * Seeds first (state, age, gender, area), then the question that could change the most undecided schemes.
 * A question that can't change any result is never asked. Last, an optional "which do you already get?".
 * Returns null when there is nothing left to ask.
 */
export function nextQuestion(answers: Answers, schemes: Scheme[] = SCHEMES): NextQuestion | null {
  for (const id of SEEDS) {
    if (!answered(answers, id)) {
      const attr = ATTRIBUTES.find((a) => a.id === id)!;
      const imp = impactOf(attr, answers, schemes);
      return { attr: id, affectsCount: imp.affectedSchemes.length, affectedSchemes: imp.affectedSchemes };
    }
  }
  const best = rankQuestions(answers, schemes)[0];
  if (best) return { attr: best.attr, affectsCount: best.affectedSchemes.length, affectedSchemes: best.affectedSchemes };

  if (!answered(answers, 'already_receiving')) {
    const profile = derive(answers);
    const eligible = schemes.filter((s) => evaluate(s.rule, profile).value === 'T').map((s) => s.id);
    if (eligible.length > 0) return { attr: 'already_receiving', affectsCount: eligible.length, affectedSchemes: eligible, final: true };
  }
  return null;
}

/** Estimated questions left: unanswered seeds + every question that could still matter + the final step. */
export function estimateRemaining(answers: Answers, schemes: Scheme[] = SCHEMES): number {
  const seeds = SEEDS.filter((id) => !answered(answers, id)).length;
  if (seeds > 0) {
    // Before the seeds are in, count every non-seed question that touches any rule.
    const touched = new Set(schemes.flatMap((s) => ruleLeaves(s.rule).map((l) => l.attr)));
    const others = ATTRIBUTES.filter((a) => !a.seed && !a.derived_only && !a.ask_if && a.kind !== 'multi' && touched.has(a.id) && !answered(answers, a.id));
    return seeds + others.length + 1;
  }
  const rest = rankQuestions(answers, schemes).length;
  const final = answered(answers, 'already_receiving') ? 0 : 1;
  return rest + final;
}

export interface Skip {
  attr: string;
  /** Schemes that use this question, all already decided, with the condition that decided each. */
  decidedBy: { scheme: string; value: Tri; leaf: Leaf | null }[];
}

/** Questions we will not ask, and why (for the presenter trace). */
export function explainSkips(answers: Answers, schemes: Scheme[] = SCHEMES): Skip[] {
  const profile = derive(answers);
  const out: Skip[] = [];
  for (const a of ATTRIBUTES) {
    if (!isAskable(a, answers, profile)) continue;
    const users = schemes.filter((s) => ruleLeaves(s.rule).some((l) => l.attr === a.id));
    if (users.length === 0) continue;
    const results = users.map((s) => ({ s, r: evaluate(s.rule, profile) }));
    if (results.some(({ r }) => r.value === 'U')) {
      // Still open somewhere: only a skip if no answer could change it.
      if (impactOf(a, answers, schemes).affectedSchemes.length > 0) continue;
    }
    out.push({
      attr: a.id,
      decidedBy: results.map(({ s, r }) => ({ scheme: s.id, value: r.value, leaf: r.value === 'F' ? (r.failed[0] ?? null) : (r.satisfied[0] ?? null) })),
    });
  }
  return out;
}
