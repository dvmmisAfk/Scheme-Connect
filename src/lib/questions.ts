import { ATTR_BY_ID } from '@/data';
import { DERIVED_FROM } from '@/engine/derive';
import { evalLeafValue } from '@/engine/evaluate';
import { derive } from '@/engine/derive';
import type { Answers, Attribute, Leaf } from '@/engine/types';

/**
 * The question to ask to resolve a "needs an answer" scheme: its first missing attribute,
 * or, for a derived attribute whose source is unknown, the source question (occupation).
 */
export function questionFor(missing: string[], answers: Answers): Attribute | null {
  const profile = derive(answers);
  for (const m of missing) {
    const a = ATTR_BY_ID[m];
    if (!a) continue;
    const src = DERIVED_FROM[m];
    if (src && profile[src] === undefined) return ATTR_BY_ID[src] ?? null;
    if (a.derived_only) continue;
    if (a.ask_if && evalLeafValue(a.ask_if as Leaf, profile) !== 'T') continue;
    return a;
  }
  return null;
}

/** Display string for a stored answer. */
export function answerLabel(attr: Attribute, value: unknown, lang: 'en' | 'hi'): string | null {
  if (value === null || value === undefined) return null;
  if (attr.options) {
    const o = attr.options.find((x) => x.value === value);
    return o ? o.label[lang] : String(value);
  }
  if (typeof value === 'number') return `${value}${attr.unit ? ' ' + attr.unit[lang] : ''}`;
  return String(value);
}
