import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api } from '@/api';
import type { Doc, Leaf, Scheme } from '@/engine/types';
import { Button, Column, ErrorState, ICON, Loading, SectionTitle, TopBar } from '@/components/ui';
import { StatusTag } from '@/components/StatusGlyph';
import { SourceLine } from '@/components/SourceLine';
import { QuestionInput } from '@/components/QuestionInput';
import { useSession } from '@/store/session';
import { useAsync, useLang } from '@/lib/hooks';
import { questionFor } from '@/lib/questions';
import { stampDate } from '@/lib/format';

/** Official CSC locator. We never show addresses or distances ourselves. */
export const CSC_LOCATOR_URL = 'https://locator.csccloud.in/';

/** Documents as shown: MP state schemes always list the Samagra ID. */
export function checklistFor(s: Scheme): Doc[] {
  const docs = [...s.documents];
  if (s.state === 'MP' && !docs.some((d) => d.kind === 'samagra')) docs.push({ text: { en: 'Samagra ID', hi: 'समग्र आईडी' }, kind: 'samagra' });
  return docs;
}

function Sentences({ leaves, failed }: { leaves: Leaf[]; failed?: boolean }) {
  const { tx } = useLang();
  return (
    <ul className="divide-y divide-line border-y border-line">
      {leaves.map((l, i) => (
        <li key={i} className="py-2">
          {tx(failed ? (l.fail_label ?? l.label) : l.label)}
        </li>
      ))}
    </ul>
  );
}

export function DocChecklist({ scheme, printable }: { scheme: Scheme; printable?: boolean }) {
  const { t } = useTranslation();
  const { tx } = useLang();
  const tickedRaw = useSession((s) => s.docs[scheme.id]);
  const ticked = tickedRaw ?? {};
  const toggle = useSession((s) => s.toggleDoc);
  const docs = checklistFor(scheme);
  const done = docs.filter((_, i) => ticked[i]).length;
  return (
    <>
      <p className="no-print mb-2 text-sm text-ink-2">
        {t('detail.documentsHelp')} {t('detail.readyCount', { done, total: docs.length })}
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface print:rounded-none">
        {docs.map((d, i) => (
          <li key={i}>
            <label className="flex min-h-[56px] cursor-pointer items-start gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={!!ticked[i]}
                onChange={() => toggle(scheme.id, i)}
                disabled={printable}
                className="mt-1 h-[20px] w-[20px] shrink-0 accent-[var(--green)]"
              />
              <span>
                <span className="block">{tx(d.text)}</span>
                {d.kind === 'aadhaar' && <span className="block text-sm text-ink-2">{t('detail.aadhaarNote')}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function SchemeDetail() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { tx, lang } = useLang();
  const answers = useSession((s) => s.answers);
  const answer = useSession((s) => s.answer);
  const hasAnswers = Object.keys(answers).length > 0;

  const scheme = useAsync(() => api.getScheme(id), [id]);
  const screened = useAsync(() => (hasAnswers ? api.screen({ answers }) : Promise.resolve(null)), [JSON.stringify(answers)]);
  const r = screened.data?.results.find((x) => x.scheme.id === id);

  if (scheme.status === 'error') return <ErrorState onRetry={scheme.retry} />;
  if (scheme.status === 'loading' && !scheme.data) {
    return (
      <>
        <TopBar back="/results" />
        <Column>
          <Loading />
        </Column>
      </>
    );
  }
  const s = scheme.data;
  if (!s) {
    return (
      <>
        <TopBar back="/results" />
        <Column>
          <p className="py-12 text-lg">{t('detail.notFound')}</p>
        </Column>
      </>
    );
  }

  const other = lang === 'en' ? 'hi' : 'en';
  const mini = r?.status === 'possibly' ? questionFor(r.missing, answers) : null;

  return (
    <>
      <TopBar back="/results" title={s.short} />
      <Column
        bar={
          <Button variant="primary" className="w-full" onClick={() => window.print()}>
            {t('detail.print')}
          </Button>
        }
      >
        <div className="print-only mb-4">
          <p className="font-mono text-xs">{t('app.name')}</p>
          <p className="text-sm">{t('detail.checklistFor')}</p>
        </div>

        <h1 className="text-2xl font-semibold">{tx(s.name)}</h1>
        <p lang={other} className="mt-1 text-ink-2">
          {s.name[other]}
        </p>
        <p className="mt-2 text-sm text-ink-2">
          {t(`level.${s.level}`)} · {t('detail.ministry')}: {s.ministry ? tx(s.ministry) : t('common.confirmAtCsc')}
        </p>

        {r && (
          <div className="mt-4">
            <StatusTag status={r.status} />
          </div>
        )}
        {!hasAnswers && <p className="no-print mt-4 text-sm text-ink-2">{t('detail.noProfile')}</p>}

        {s.enrolment_status !== 'open' && (
          <p className="mt-4 rounded-control border border-line bg-surface p-4">
            {s.enrolment_status === 'closed' ? t('detail.closed') : t('detail.viaSurvey')}
          </p>
        )}

        {r && (r.status === 'eligible' || r.status === 'already') && (
          <section className="no-print mt-8">
            <SectionTitle>{t('detail.whyQualify')}</SectionTitle>
            <Sentences leaves={r.satisfied} />
          </section>
        )}
        {r?.status === 'not' && (
          <section className="no-print mt-8">
            <SectionTitle>{t('detail.whyNot')}</SectionTitle>
            <Sentences leaves={r.failed} failed />
          </section>
        )}
        {r?.status === 'possibly' && (
          <section className="no-print mt-8">
            <SectionTitle>{t('detail.stillNeed')}</SectionTitle>
            {mini && (
              <div className="mb-6">
                <p className="mb-2 font-medium">{tx(mini.question)}</p>
                <QuestionInput compact attr={mini} value={answers[mini.id]} onAnswer={(v) => answer(mini.id, v)} />
              </div>
            )}
            {r.satisfied.length > 0 && (
              <>
                <SectionTitle>{t('detail.soFar')}</SectionTitle>
                <Sentences leaves={r.satisfied} />
              </>
            )}
          </section>
        )}

        <section className="mt-8">
          <SectionTitle>{t('detail.benefit')}</SectionTitle>
          <p>{tx(s.benefit)}</p>
          {s.benefit_note && <p className="mt-1 text-sm text-ink-2">{tx(s.benefit_note)}</p>}
        </section>

        <section className="mt-8">
          <SectionTitle>{t('detail.documents')}</SectionTitle>
          <DocChecklist scheme={s} />
        </section>

        <section className="mt-8">
          <SectionTitle>{t('detail.howToApply')}</SectionTitle>
          <p>{s.how_to_apply ? tx(s.how_to_apply) : t('common.confirmAtCsc')}</p>
          <a
            href={CSC_LOCATOR_URL}
            target="_blank"
            rel="noreferrer"
            className="no-print mt-3 flex min-h-touch items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3"
          >
            <span>
              <span className="block font-medium">{t('detail.findCsc')}</span>
              <span className="block text-sm text-ink-2">{t('detail.findCscHelp')}</span>
            </span>
            <ExternalLink {...ICON} aria-hidden="true" className="shrink-0 text-ink-2" />
          </a>
        </section>

        <div className="mt-8">
          <SourceLine url={s.source_url} verified={s.last_verified} />
          <p className="print-only mt-1 font-mono text-xs">{t('detail.printedOn', { date: stampDate(new Date().toISOString()) })}</p>
        </div>
      </Column>
    </>
  );
}
