export type Lang = 'en' | 'hi';
export type Text = { en: string; hi: string };

export type Tri = 'T' | 'F' | 'U';

export type Op = 'eq' | 'neq' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'is_true' | 'is_false';

export type Scalar = string | number | boolean;

export interface Leaf {
  attr: string;
  op: Op;
  /** Absent for is_true / is_false. Array for `in`; [min, max] for `between` (inclusive). */
  value?: Scalar | Scalar[];
  /** Sentence when the condition holds ("You have a bank account"). */
  label: Text;
  /** Sentence when it doesn't ("You don't have a bank account"). Used for "not eligible" reasons. */
  fail_label?: Text;
}

export type RuleNode = { all: RuleNode[] } | { any: RuleNode[] } | { not: RuleNode } | Leaf;

export interface EvalResult {
  value: Tri;
  satisfied: Leaf[];
  failed: Leaf[];
  /** Unknown attributes, taken from U children only. */
  missing: string[];
}

/** What the user told us. `null` = answered "I don't know" (asked, but unknown). Absent = not asked yet. */
export type Answers = { [attr: string]: Scalar | null | string[] | undefined };

/** Answers plus derived attributes; unknown attributes are simply absent. */
export type Profile = { [attr: string]: Scalar | string[] | undefined };

export type EnrolmentStatus = 'open' | 'closed' | 'via_survey';
export type Need = 'health' | 'money_monthly' | 'farming' | 'housing' | 'education' | 'insurance' | 'pension';

export interface Doc {
  text: Text;
  /** Marks documents the UI treats specially (Aadhaar note, Samagra ID). */
  kind?: 'aadhaar' | 'samagra';
}

export interface Scheme {
  id: string;
  short: string;
  name: Text;
  level: 'central' | 'state' | 'central_state';
  state: 'MP' | null;
  ministry: Text | null;
  category: string;
  need: Need | null;
  rule_version: string;
  rule: RuleNode;
  benefit: Text;
  /** Parts of the benefit not in the knowledge base. UI shows this next to the benefit. */
  benefit_note: Text | null;
  /** ₹ per year, used only for ranking. null = not known (ranks as 0.3). */
  value: number | null;
  how_to_apply: Text | null;
  documents: Doc[];
  source_url: string;
  source_label: string;
  /** ISO date the team checked source_url. null until checked. */
  last_verified: string | null;
  enrolment_status: EnrolmentStatus;
  deadline: string | null;
  core_test: boolean;
}

export type AttrKind = 'enum' | 'bool' | 'number' | 'bucket' | 'multi';

export interface Option {
  /** null = "I don't know" / "prefer not to say": stored as unknown. */
  value: Scalar | null;
  label: Text;
}

export interface Attribute {
  id: string;
  kind: AttrKind;
  /** Short noun used in traces ("LPG connection"). */
  short: Text;
  question: Text;
  help?: Text;
  seed?: boolean;
  /** Never asked; computed by derive.ts. */
  derived_only?: boolean;
  /** Ask only when this holds (evaluated on the derived profile, must be T). */
  ask_if?: Leaf | { attr: string; op: Op; value?: Scalar | Scalar[] };
  options?: Option[];
  min?: number;
  max?: number;
  unit?: Text;
}

export type ScreenStatus = 'eligible' | 'possibly' | 'not' | 'already';

export interface ScreenResult {
  scheme: Scheme;
  status: ScreenStatus;
  value: Tri;
  satisfied: Leaf[];
  failed: Leaf[];
  missing: string[];
  /** For "not": the first failed condition. */
  reason: Leaf | null;
}

export interface NextQuestion {
  attr: string;
  affectsCount: number;
  affectedSchemes: string[];
  /** True for the optional final "which do you already get?" step. */
  final?: boolean;
}
