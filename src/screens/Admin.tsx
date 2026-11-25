import { Link, useParams } from 'react-router-dom';
import { api } from '@/api';
import { isLeaf } from '@/engine/evaluate';
import type { RuleNode, Scheme } from '@/engine/types';
import { Loading } from '@/components/ui';
import { SourceLine } from '@/components/SourceLine';
import { useAsync } from '@/lib/hooks';
import { stampDate } from '@/lib/format';

export const STALE_DAYS = 90;
export const daysSince = (iso: string | null, now = new Date()) => (iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000) : null);

function Wide({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <nav className="mb-6 flex gap-4 font-mono text-xs text-ink-2">
        <Link to="/admin/schemes" className="underline">Catalogue</Link>
        <Link to="/lab" className="underline">Engine Lab</Link>
        <Link to="/" className="underline">Citizen app</Link>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}
export { Wide };

const STATUS_TEXT: Record<Scheme['enrolment_status'], string> = { open: 'Open', closed: 'Closed', via_survey: 'Via survey' };

export default function AdminSchemes() {
  const list = useAsync(() => api.listSchemes(), []);
  return (
    <Wide title="Scheme catalogue">
      <p className="mb-4 text-sm text-ink-2">
        Read-only. {list.data?.length ?? 0} schemes. Rows not verified in the last {STALE_DAYS} days are marked.
      </p>
      {!list.data ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto rounded-control border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-2">
              <tr>
                {['Name', 'Level', 'Category', 'Enrolment', 'Rule version', 'Last verified', 'Days since'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.data.map((s) => {
                const d = daysSince(s.last_verified);
                const stale = d === null || d > STALE_DAYS;
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3"><Link to={`/admin/schemes/${s.id}`} className="font-medium underline decoration-line underline-offset-4">{s.name.en}</Link></td>
                    <td className="px-4 py-3">{s.level}</td>
                    <td className="px-4 py-3">{s.category}</td>
                    <td className="px-4 py-3">{STATUS_TEXT[s.enrolment_status]}</td>
                    <td className="px-4 py-3 font-mono">{s.rule_version}</td>
                    <td className="px-4 py-3 font-mono">{s.last_verified ? stampDate(s.last_verified) : '—'}</td>
                    <td className={`px-4 py-3 font-mono ${stale ? 'bg-amber-tint text-amber' : ''}`}>
                      {d === null ? 'Not verified' : d}
                      {stale && d !== null && ` (over ${STALE_DAYS})`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Wide>
  );
}

function fmtVal(v: unknown) {
  return Array.isArray(v) ? `[${v.join(', ')}]` : v === undefined ? '' : String(v);
}

export function RuleTree({ node }: { node: RuleNode }) {
  if (isLeaf(node)) {
    return (
      <li className="py-1">
        <code className="font-mono text-xs">{node.attr} {node.op} {fmtVal(node.value)}</code>
        <span className="ml-2 text-sm text-ink-2">{node.label.en}</span>
      </li>
    );
  }
  const [kind, kids] = 'all' in node ? ['ALL of', node.all] : 'any' in node ? ['ANY of', node.any] : ['NOT', [node.not]];
  return (
    <li className="py-1">
      <span className="font-mono text-xs font-medium">{kind}</span>
      <ul className="ml-3 border-l border-line pl-4">{kids.map((k, i) => <RuleTree key={i} node={k} />)}</ul>
    </li>
  );
}

export function AdminScheme() {
  const { id = '' } = useParams();
  const s = useAsync(() => api.getScheme(id), [id]);
  if (!s.data) return <Wide title="Scheme">{s.status === 'loading' ? <Loading /> : <p>Not found.</p>}</Wide>;
  const x = s.data;
  return (
    <Wide title={x.name.en}>
      <p lang="hi" className="-mt-4 mb-6 text-ink-2">{x.name.hi}</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-2">Rule v{x.rule_version}</h2>
          <ul className="rounded-control border border-line bg-surface p-4"><RuleTree node={x.rule} /></ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-2">Raw JSON</h2>
          <pre className="max-h-[480px] overflow-auto rounded-control border border-line bg-surface p-4 font-mono text-xs">{JSON.stringify(x.rule, null, 2)}</pre>
        </section>
      </div>
      <div className="mt-8"><SourceLine url={x.source_url} verified={x.last_verified} /></div>
    </Wide>
  );
}
