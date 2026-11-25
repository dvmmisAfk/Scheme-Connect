import type { EvalResult, Leaf, Profile, RuleNode, Scalar, Tri } from './types';

export const isLeaf = (n: RuleNode): n is Leaf => 'attr' in n;

const uniq = (xs: string[]) => [...new Set(xs)];

export function evalLeafValue(leaf: Pick<Leaf, 'attr' | 'op' | 'value'>, profile: Profile): Tri {
  const v = profile[leaf.attr];
  if (v === undefined || v === null) return 'U';
  const x = leaf.value;
  const b = (c: boolean): Tri => (c ? 'T' : 'F');
  switch (leaf.op) {
    case 'eq':
      return b(v === x);
    case 'neq':
      return b(v !== x);
    case 'in':
      return b(Array.isArray(x) && x.includes(v as Scalar));
    case 'lt':
      return b(typeof v === 'number' && v < (x as number));
    case 'lte':
      return b(typeof v === 'number' && v <= (x as number));
    case 'gt':
      return b(typeof v === 'number' && v > (x as number));
    case 'gte':
      return b(typeof v === 'number' && v >= (x as number));
    case 'between': {
      const [lo, hi] = x as [number, number];
      return b(typeof v === 'number' && v >= lo && v <= hi);
    }
    case 'is_true':
      return b(v === true);
    case 'is_false':
      return b(v === false);
  }
}

/**
 * Kleene three-valued evaluation.
 *  ALL: F if any child F, else U if any U, else T.
 *  ANY: T if any child T, else U if any U, else F.
 *  NOT: swaps T/F (and satisfied/failed); U stays U.
 *  `missing` collects unknown attributes from U children only.
 */
export function evaluate(node: RuleNode, profile: Profile): EvalResult {
  if (isLeaf(node)) {
    const value = evalLeafValue(node, profile);
    return {
      value,
      satisfied: value === 'T' ? [node] : [],
      failed: value === 'F' ? [node] : [],
      missing: value === 'U' ? [node.attr] : [],
    };
  }
  if ('not' in node) {
    const r = evaluate(node.not, profile);
    const value: Tri = r.value === 'T' ? 'F' : r.value === 'F' ? 'T' : 'U';
    return { value, satisfied: r.failed, failed: r.satisfied, missing: r.missing };
  }
  const isAll = 'all' in node;
  const kids = (isAll ? node.all : node.any).map((c) => evaluate(c, profile));
  const has = (t: Tri) => kids.some((k) => k.value === t);
  const value: Tri = isAll ? (has('F') ? 'F' : has('U') ? 'U' : 'T') : has('T') ? 'T' : has('U') ? 'U' : 'F';
  const missing = uniq(kids.filter((k) => k.value === 'U').flatMap((k) => k.missing));

  if (!isAll && value === 'T') {
    // An ANY that holds is explained by the branches that hold, not the ones that don't.
    return { value, satisfied: kids.filter((k) => k.value === 'T').flatMap((k) => k.satisfied), failed: [], missing };
  }
  return {
    value,
    satisfied: kids.flatMap((k) => k.satisfied),
    failed: kids.flatMap((k) => k.failed),
    missing,
  };
}

/** Every attribute referenced anywhere in a rule. */
export function ruleAttrs(node: RuleNode): string[] {
  if (isLeaf(node)) return [node.attr];
  if ('not' in node) return ruleAttrs(node.not);
  return uniq(('all' in node ? node.all : node.any).flatMap(ruleAttrs));
}

/** Every leaf in a rule, in order. */
export function ruleLeaves(node: RuleNode): Leaf[] {
  if (isLeaf(node)) return [node];
  if ('not' in node) return ruleLeaves(node.not);
  return ('all' in node ? node.all : node.any).flatMap(ruleLeaves);
}
