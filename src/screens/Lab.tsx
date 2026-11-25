import { useMemo, useState } from 'react';
import { ATTRIBUTES, SCHEMES } from '@/data';
import { candidateValues } from '@/engine/nextQuestion';
import { expectedStatus, PERSONAS } from '@/engine/personas';
import { DEFAULT_WEIGHTS, rank, type Weights } from '@/engine/rank';
import { screen } from '@/engine/screen';
import type { Answers, ScreenStatus } from '@/engine/types';
import { Glyph } from '@/components/StatusGlyph';
import { Button } from '@/components/ui';
import { Wide } from './Admin';

const CORE = SCHEMES.filter((s) => s.core_test);
const ASKABLE = ATTRIBUTES.filter((a) => !a.derived_only && a.kind !== 'multi');

function PersonaTests() {
  const [run, setRun] = useState<null | { rows: { id: string; label: string; cells: { exp: string; act: ScreenStatus; ok: boolean }[] }[]; pass: number; total: number }>(null);
  const go = () => {
    let pass = 0;
    const rows = PERSONAS.map((p) => {
      const res = screen(p.answers, CORE);
      const cells = res.map((r) => {
        const exp = expectedStatus(p, r.scheme.id);
        const ok = r.status === exp;
        if (ok) pass++;
        return { exp, act: r.status, ok };
      });
      return { id: p.id, label: p.label.en, cells };
    });
    setRun({ rows, pass, total: PERSONAS.length * CORE.length });
  };
  return (
    <section>
      <div className="mb-4 flex items-center gap-6">
        <Button variant="primary" onClick={go}>Run persona tests</Button>
        {run && (
          <p className={`font-mono text-2xl font-semibold ${run.pass === run.total ? 'text-green' : 'text-danger'}`}>
            {run.pass} / {run.total} passed
          </p>
        )}
      </div>
      {run && (
        <div className="overflow-x-auto rounded-control border border-line bg-surface">
          <table className="text-left text-xs">
            <thead className="border-b border-line">
              <tr>
                <th className="px-3 py-2">Persona</th>
                {CORE.map((s) => <th key={s.id} className="px-2 py-2 font-mono font-medium">{s.short}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {run.rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2 font-normal"><span className="font-mono">{r.id}</span> {r.label}</th>
                  {r.cells.map((c, i) => (
                    <td key={i} className={`px-2 py-2 ${c.ok ? '' : 'bg-amber-tint'}`} title={`expected ${c.exp}, got ${c.act}`}>
                      <span className="inline-flex items-center gap-1">
                        <Glyph status={c.act} size={16} />
                        <span className="sr-only">{c.act}</span>
                        {!c.ok && <span className="font-mono text-danger">exp {c.exp}</span>}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-ink-2">Each cell: actual status (glyph). Expected values come from Appendix B. A mismatch shows the expected status.</p>
    </section>
  );
}

function randomProfile(): Answers {
  const a: Answers = {};
  for (const at of ASKABLE) {
    if (Math.random() < 0.15) continue; // unknown
    const vals = at.kind === 'number' ? [Math.round(Math.random() * ((at.max ?? 100) - (at.min ?? 0)) + (at.min ?? 0))] : candidateValues(at);
    a[at.id] = vals[Math.floor(Math.random() * vals.length)]!;
  }
  return a;
}

function Benchmark() {
  const [n, setN] = useState(10000);
  const [out, setOut] = useState<null | { n: number; ms: number }>(null);
  const [busy, setBusy] = useState(false);
  const go = () => {
    setBusy(true);
    setTimeout(() => {
      const profiles = Array.from({ length: n }, randomProfile);
      const t0 = performance.now();
      for (const p of profiles) screen(p);
      setOut({ n, ms: performance.now() - t0 });
      setBusy(false);
    }, 20);
  };
  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          Profiles
          <input type="number" min={1} max={200000} value={n} onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))} className="min-h-touch w-[128px] rounded-control border border-line bg-surface px-3 font-mono" />
        </label>
        <Button variant="primary" onClick={go} disabled={busy}>{busy ? 'Running…' : 'Run benchmark'}</Button>
      </div>
      {out && (
        <p className="mt-4 font-mono">
          {out.n.toLocaleString('en-IN')} profiles × {SCHEMES.length} schemes in {out.ms.toFixed(0)} ms · {(out.ms / out.n).toFixed(4)} ms per profile
          <span className="block text-xs text-ink-2">in this browser on this device</span>
        </p>
      )}
    </section>
  );
}

function Playground() {
  const [a, setA] = useState<Answers>(() => ({ ...PERSONAS[7]!.answers }));
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS);
  const ranked = useMemo(() => rank(screen(a), { weights: w }), [a, w]);
  const set = (id: string, v: Answers[string] | undefined) => setA((x) => { const y = { ...x }; if (v === undefined) delete y[id]; else y[id] = v; return y; });
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {PERSONAS.map((p) => <Button key={p.id} onClick={() => setA({ ...p.answers })} className="min-h-[40px] px-3 text-sm">{p.id}</Button>)}
          <Button onClick={() => setA({})} className="min-h-[40px] px-3 text-sm">Clear</Button>
        </div>
        <div className="divide-y divide-line rounded-control border border-line bg-surface">
          {ASKABLE.map((at) => (
            <label key={at.id} className="flex items-center gap-3 px-3 py-1">
              <span className="flex-1 font-mono text-xs">{at.id}</span>
              {at.kind === 'number' ? (
                <input value={typeof a[at.id] === 'number' ? String(a[at.id]) : ''} placeholder="unknown" onChange={(e) => set(at.id, e.target.value === '' ? undefined : Number(e.target.value))} className="h-[36px] w-[112px] rounded-control border border-line px-2 font-mono text-xs" />
              ) : (
                <select value={a[at.id] === undefined || a[at.id] === null ? '' : JSON.stringify(a[at.id])} onChange={(e) => set(at.id, e.target.value === '' ? undefined : JSON.parse(e.target.value))} className="h-[36px] w-[176px] rounded-control border border-line bg-surface px-2 font-mono text-xs">
                  <option value="">unknown</option>
                  {at.options!.filter((o) => o.value !== null).map((o) => <option key={String(o.value)} value={JSON.stringify(o.value)}>{String(o.value)}</option>)}
                </select>
              )}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-4 grid grid-cols-2 gap-3 font-mono text-xs">
          {(Object.keys(w) as (keyof Weights)[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <span className="w-[64px]">{k}</span>
              <input type="range" min={0} max={1} step={0.05} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} className="flex-1 accent-[var(--ink)]" />
              <span className="w-8">{w[k].toFixed(2)}</span>
            </label>
          ))}
        </div>
        {(['eligible', 'possibly', 'already', 'not'] as const).map((s) => {
          const list = ranked.filter((r) => r.status === s);
          if (!list.length) return null;
          return (
            <div key={s} className="mb-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Glyph status={s} />{s} ({list.length})</h3>
              <ul className="divide-y divide-line rounded-control border border-line bg-surface font-mono text-xs">
                {list.map((r) => (
                  <li key={r.scheme.id} className="flex gap-3 px-3 py-2">
                    <span className="flex-1">{r.scheme.short}{r.scheme.enrolment_status === 'closed' ? ' (closed)' : ''}</span>
                    {s === 'possibly' && <span className="text-amber">missing: {r.missing.join(', ')}</span>}
                    {s === 'not' && <span className="text-ink-2">{r.reason?.fail_label?.en}</span>}
                    {(s === 'eligible' || s === 'already') && <span>S={r.score.toFixed(3)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Lab() {
  return (
    <Wide title="Engine Lab">
      <h2 className="mb-3 text-lg font-semibold">Persona tests</h2>
      <PersonaTests />
      <h2 className="mb-3 mt-12 text-lg font-semibold">Benchmark</h2>
      <Benchmark />
      <h2 className="mb-3 mt-12 text-lg font-semibold">Playground</h2>
      <Playground />
    </Wide>
  );
}
