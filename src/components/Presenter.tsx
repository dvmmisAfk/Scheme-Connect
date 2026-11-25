import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ATTR_BY_ID, SCHEME_BY_ID } from '@/data';
import { PERSONAS } from '@/engine/personas';
import { bucketFor } from '@/engine/buckets';
import type { Answers } from '@/engine/types';
import { useSession } from '@/store/session';
import { ICON } from './ui';

const name = (id: string) => SCHEME_BY_ID[id]?.short ?? id;
const attrName = (id: string) => ATTR_BY_ID[id]?.short.en ?? id;
const LABEL = { eligible: 'eligible', possibly: 'needs an answer', already: 'already receiving', not: 'not eligible' };

/** Presenter mode: ?presenter=1 or the T key. Engine Trace panel (right on desktop, bottom sheet on mobile). */
export function Presenter() {
  const on = useSession((s) => s.presenter);
  const setOn = useSession((s) => s.setPresenter);
  const trace = useSession((s) => s.trace);
  const loadAnswers = useSession((s) => s.loadAnswers);
  const start = useSession((s) => s.start);
  const setConsent = useSession((s) => s.setConsent);
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (new URLSearchParams(loc.search).get('presenter') === '1') setOn(true);
  }, [loc.search, setOn]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 't' || e.key === 'T') setOn(!useSession.getState().presenter);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [setOn]);

  if (!on) return null;

  const load = (pid: string) => {
    const a: Answers = { ...PERSONAS.find((p) => p.id === pid)!.answers, already_receiving: [] };
    for (const k of ['annual_family_income', 'monthly_income']) if (typeof a[k] === 'number') a[k] = bucketFor(k, a[k] as number);
    setConsent(true);
    start('self', false);
    loadAnswers(a);
    nav('/results');
  };

  return (
    <aside
      aria-label="Engine trace"
      className={`no-print fixed inset-x-0 bottom-0 z-30 flex max-h-[50vh] flex-col rounded-t-sheet border-t border-line bg-surface shadow-sheet lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[360px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none ${open ? '' : 'max-h-[56px]'}`}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <button type="button" onClick={() => setOpen(!open)} className="min-h-touch flex-1 text-left font-mono text-xs font-medium">
          Engine trace {open ? '' : '(tap to open)'}
        </button>
        <select aria-label="Load persona" onChange={(e) => e.target.value && load(e.target.value)} value="" className="h-[36px] rounded-control border border-line bg-surface px-2 font-mono text-xs">
          <option value="">Load persona…</option>
          {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.label.en}</option>)}
        </select>
        <button type="button" aria-label="Close presenter mode" onClick={() => setOn(false)} className="inline-flex min-h-touch min-w-touch items-center justify-center">
          <X {...ICON} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <ol className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
          {trace.length === 0 && <li className="py-2 text-ink-2">Answer a question to see what the engine decides.</li>}
          {[...trace].reverse().map((e, i) => (
            <li key={e.at + '-' + i} className="border-b border-line py-2">
              <p className="font-medium">{attrName(e.attr)} = {Array.isArray(e.value) ? `[${e.value.join(', ')}]` : e.value === null ? "don't know" : String(e.value)}</p>
              {e.decided.map((d) => (
                <p key={d.scheme}>→ {name(d.scheme)}: {LABEL[d.from]} → {LABEL[d.to]}</p>
              ))}
              {e.skipped.map((s) => (
                <p key={s.attr} className="text-ink-2">
                  Skipped {attrName(s.attr)}: {s.decidedBy.map((d) => `${name(d.scheme)} already decided${d.because ? ` (${d.because.en.toLowerCase()})` : ''}`).join('; ')}
                </p>
              ))}
              {e.decided.length === 0 && e.skipped.length === 0 && <p className="text-ink-2">No scheme changed.</p>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
