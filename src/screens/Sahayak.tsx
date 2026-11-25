import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '@/api';
import { ATTR_BY_ID } from '@/data';
import type { Ranked } from '@/engine/rank';
import { Button, Column, ICON, Loading, SectionTitle, TopBar } from '@/components/ui';
import { SchemeRow } from '@/components/SchemeRow';
import { SourceLine } from '@/components/SourceLine';
import { checklistFor } from '@/screens/SchemeDetail';
import { useSession } from '@/store/session';
import { CENTRE_LABEL, isToday, listFamilies, seedDemo, type Family } from '@/store/families';
import { useAsync, useLang } from '@/lib/hooks';
import { firstSentence, stampDate } from '@/lib/format';

function useRole() {
  const { t } = useTranslation();
  const { tx } = useLang();
  return (f: Family) => {
    const o = ATTR_BY_ID.occupation!.options!.find((x) => x.value === f.answers.occupation);
    const role = o && o.value !== null ? tx(o.label).split(' (')[0]!.toLowerCase() : t('sahayak.roleUnknown');
    return t('sahayak.familyLabel', { n: f.n, role, count: f.members });
  };
}

async function screenFamilies(fs: Family[]) {
  return Promise.all(fs.map(async (f) => ({ f, results: (await api.screen({ answers: f.answers })).results })));
}

/** One printed page per family: eligible schemes with their document checklists. */
function PrintFamilies({ data }: { data: { f: Family; results: Ranked[] }[] }) {
  const { t } = useTranslation();
  const { tx } = useLang();
  const label = useRole();
  return (
    <div className="print-only">
      {data.map(({ f, results }, i) => (
        <section key={f.id} className={i > 0 ? 'print-break' : ''}>
          <p className="font-mono text-xs">{t('app.name')} · {CENTRE_LABEL}</p>
          <h2 className="mt-2 text-xl font-semibold">{label(f)}</h2>
          {results.filter((r) => r.status === 'eligible').map((r) => (
            <div key={r.scheme.id} className="mt-4">
              <h3 className="font-semibold">{tx(r.scheme.name)}</h3>
              <ul className="mt-1">
                {checklistFor(r.scheme).map((d, j) => (
                  <li key={j}>☐ {tx(d.text)}{d.kind === 'aadhaar' ? ` (${t('detail.aadhaarNote')})` : ''}</li>
                ))}
              </ul>
              <SourceLine url={r.scheme.source_url} verified={r.scheme.last_verified} />
            </div>
          ))}
          <p className="mt-4 font-mono text-xs">{t('detail.printedOn', { date: stampDate(new Date().toISOString()) })}</p>
        </section>
      ))}
    </div>
  );
}

export default function Sahayak() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const startFamily = useSession((s) => s.startFamily);
  const label = useRole();
  const [agreed, setAgreed] = useState(false);
  const [members, setMembers] = useState('4');
  const fams = useAsync(async () => screenFamilies(await listFamilies()), []);
  const data = fams.data ?? [];
  const today = data.filter(({ f }) => isToday(f.screenedAt)).length;

  const start = () => {
    startFamily(Math.max(1, Number(members) || 1));
    nav('/check');
  };

  return (
    <>
      <TopBar back="/" title={t('sahayak.title')} />
      <Column
        bar={
          <Button variant="primary" className="w-full" disabled={!agreed} onClick={start}>
            {t('sahayak.start')}
          </Button>
        }
      >
        <div className="no-print">
          <p className="font-mono text-xs text-ink-2">
            {CENTRE_LABEL} · {api.mode === 'local' ? t('sahayak.savedOnDevice') : t('sahayak.server')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{t('sahayak.screenedToday', { count: today })}</h1>

          <section className="mt-6">
            <label className="flex cursor-pointer gap-3 rounded-control border border-line bg-surface p-4">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-[20px] w-[20px] shrink-0 accent-[var(--green)]" />
              <span>{t('sahayak.consent')}</span>
            </label>
            <label className="mt-3 flex items-center gap-3">
              <span className="flex-1">{t('sahayak.members')}</span>
              <input inputMode="numeric" value={members} onChange={(e) => setMembers(e.target.value.replace(/\D/g, ''))} className="min-h-touch w-[80px] rounded-control border border-line bg-surface px-3 text-center" />
            </label>
          </section>

          <section className="mt-8">
            <SectionTitle>{t('sahayak.families', { count: data.length })}</SectionTitle>
            {fams.status === 'loading' && !fams.data ? (
              <Loading />
            ) : data.length === 0 ? (
              <div>
                <p className="text-ink-2">{t('sahayak.empty')}</p>
                <Button className="mt-3 w-full" onClick={() => void seedDemo().then(fams.retry)}>
                  {t('sahayak.seed')}
                </Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                  {data.map(({ f, results }) => {
                    const n = results.filter((r) => r.status === 'eligible').length;
                    return (
                      <li key={f.id}>
                        <Link to={`/sahayak/family/${f.id}`} className="flex min-h-[64px] items-center gap-3 px-4 py-3 hover:bg-paper">
                          <span className="flex-1">
                            <span className="block font-medium">{label(f)}</span>
                            <span className="block text-sm text-ink-2">{t('sahayak.notAvailed', { count: n })}</span>
                          </span>
                          <ChevronRight {...ICON} aria-hidden="true" className="text-ink-2" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Button className="mt-3 w-full" onClick={() => window.print()}>
                  {t('sahayak.printAll')}
                </Button>
              </>
            )}
          </section>
        </div>
        <PrintFamilies data={data} />
      </Column>
    </>
  );
}

export function SahayakFamily() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tx } = useLang();
  const label = useRole();
  const fam = useAsync(async () => {
    const f = (await listFamilies()).find((x) => x.id === id);
    return f ? (await screenFamilies([f]))[0]! : null;
  }, [id]);

  if (fam.status === 'loading' && !fam.data) return <Loading />;
  const d = fam.data;
  return (
    <>
      <TopBar back="/sahayak" title={d ? label(d.f) : ''} />
      <Column bar={d && <Button variant="primary" className="w-full" onClick={() => window.print()}>{t('sahayak.printOne')}</Button>}>
        {!d ? (
          <p className="py-12">{t('common.notFound')}</p>
        ) : (
          <>
            <div className="no-print">
              <h1 className="text-2xl font-semibold">{label(d.f)}</h1>
              <p className="mt-1 text-ink-2">{t('sahayak.notAvailed', { count: d.results.filter((r) => r.status === 'eligible').length })}</p>
              {(['eligible', 'possibly'] as const).map((s) => {
                const list = d.results.filter((r) => r.status === s);
                return list.length ? (
                  <section key={s} className="mt-6">
                    <SectionTitle>{t(`status.${s}`)}</SectionTitle>
                    <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                      {list.map((r) => (
                        <li key={r.scheme.id}>
                          <SchemeRow scheme={r.scheme} status={s} line={firstSentence(tx(r.scheme.benefit))} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null;
              })}
            </div>
            <PrintFamilies data={[d]} />
          </>
        )}
      </Column>
    </>
  );
}
