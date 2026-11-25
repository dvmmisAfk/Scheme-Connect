import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { explainSkips } from '@/engine/nextQuestion';
import { screen } from '@/engine/screen';
import type { Answers, Need, Scalar, ScreenStatus, Text } from '@/engine/types';

export type AnswerValue = Scalar | null | string[];

export interface TraceEntry {
  at: number;
  attr: string;
  value: AnswerValue;
  /** Schemes whose status changed with this answer. */
  decided: { scheme: string; from: ScreenStatus; to: ScreenStatus }[];
  /** Questions that became pointless with this answer. */
  skipped: { attr: string; decidedBy: { scheme: string; because: Text | null }[] }[];
}

interface SessionState {
  consent: boolean;
  mode: 'self' | 'helping' | null;
  voice: boolean;
  answers: Answers;
  /** Order in which questions were answered, for Back. */
  history: string[];
  needs: Need[];
  /** Ticked documents per scheme: schemeId -> doc index -> ticked. */
  docs: Record<string, Record<number, boolean>>;
  trace: TraceEntry[];
  /** Sahayak: household size for the family being screened. */
  familyMembers: number | null;
  presenter: boolean;

  setConsent(v: boolean): void;
  startFamily(members: number): void;
  setPresenter(v: boolean): void;
  start(mode: 'self' | 'helping', voice: boolean): void;
  answer(attr: string, value: AnswerValue): void;
  back(): string | null;
  loadAnswers(answers: Answers): void;
  toggleNeed(n: Need): void;
  toggleDoc(schemeId: string, i: number): void;
  reset(): void;
}

const statusMap = (a: Answers) => new Map(screen(a).map((r) => [r.scheme.id, r.status]));

function traceFor(before: Answers, after: Answers, attr: string, value: AnswerValue): TraceEntry {
  const b = statusMap(before);
  const decided = [...statusMap(after)]
    .filter(([id, s]) => b.get(id) !== s)
    .map(([id, to]) => ({ scheme: id, from: b.get(id)!, to }));
  const prevSkips = new Set(explainSkips(before).map((s) => s.attr));
  const skipped = explainSkips(after)
    .filter((s) => !prevSkips.has(s.attr))
    .map((s) => ({
      attr: s.attr,
      decidedBy: s.decidedBy.map((d) => ({ scheme: d.scheme, because: d.leaf ? (d.value === 'F' ? (d.leaf.fail_label ?? d.leaf.label) : d.leaf.label) : null })),
    }));
  return { at: Date.now(), attr, value, decided, skipped };
}

const initial = { consent: false, mode: null, voice: false, answers: {}, history: [], needs: [], docs: {}, trace: [], familyMembers: null };

/**
 * Session state. Kept in sessionStorage (cleared when the tab closes) so a reload mid-questionnaire
 * doesn't lose answers. Long-term saving is separate, opt-in, and lives in store/saved.ts.
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initial,
      presenter: false,
      setConsent: (consent) => set({ consent }),
      startFamily: (members) => set({ ...initial, consent: true, mode: 'helping', familyMembers: members }),
      setPresenter: (presenter) => set({ presenter }),
      start: (mode, voice) => set({ mode, voice }),
      answer(attr, value) {
        const { answers, history, trace } = get();
        const next = { ...answers, [attr]: value };
        // Changing occupation invalidates the follow-ups that depend on it.
        if (attr === 'occupation') {
          if (value !== 'artisan') delete next.vishwakarma_trade;
          if (value !== 'other') delete next.unorganised_worker;
        }
        set({
          answers: next,
          history: [...history.filter((h) => h !== attr), attr],
          trace: [...trace, traceFor(answers, next, attr, value)].slice(-50),
        });
      },
      back() {
        const { history, answers } = get();
        const last = history.at(-1);
        if (!last) return null;
        const next = { ...answers };
        delete next[last];
        set({ answers: next, history: history.slice(0, -1) });
        return last;
      },
      loadAnswers: (answers) => set({ answers, history: Object.keys(answers), trace: [] }),
      toggleNeed: (n) => set((s) => ({ needs: s.needs.includes(n) ? s.needs.filter((x) => x !== n) : [...s.needs, n] })),
      toggleDoc: (schemeId, i) =>
        set((s) => ({ docs: { ...s.docs, [schemeId]: { ...s.docs[schemeId], [i]: !s.docs[schemeId]?.[i] } } })),
      reset: () => set({ ...initial }),
      // presenter survives reset (it's a display setting, not an answer).
    }),
    { name: 'sc.session', storage: createJSONStorage(() => sessionStorage), version: 1 },
  ),
);
