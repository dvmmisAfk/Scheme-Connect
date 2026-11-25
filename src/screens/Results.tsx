import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { ATTR_BY_ID, ATTRIBUTES } from '@/data';
import type { Need } from '@/engine/types';
import type { Ranked } from '@/engine/rank';
import { Button, Column, ErrorState, Loading, TopBar } from '@/components/ui';
import { SchemeRow } from '@/components/SchemeRow';
import { Glyph } from '@/components/StatusGlyph';
import { QuestionInput } from '@/components/QuestionInput';
import { useSession } from '@/store/session';
import { addFamily } from '@/store/families';
import { useAsync, useLang } from '@/lib/hooks';
import { answerLabel, questionFor } from '@/lib/questions';
import { firstSentence } from '@/lib/format';

const NEEDS: Need[] = ['health', 'money_monthly', 'farming', 'housing', 'education', 'insurance', 'pension'];

function GroupHeading({ status, children }: { status: 'eligible' | 'possibly'; children: React.ReactNode }) {
  const colour = status === 'eligible' ? 'text-green' : 'text-amber';
  return (
    <h2 className={`mb-2 flex items-center gap-2 text-sm font-semibold ${colour}`}>
      <Glyph status={status} />
      {children}
    </h2>
  );
}

function MiniQuestion({ r }: { r: Ranked }) {
  const { tx } = useLang();
  const answers = useSession((s) => s.answers);
  const answer = useSession((s) => s.answer);
  const attr = questionFor(r.missing, answers);
  if (!attr) return null;
  return (
    <div className="px-4 pb-4">
      <p className="mb-2 text-sm font-medium">{tx(attr.question)}</p>
      <QuestionInput compact attr={attr} value={answers[attr.id]} onAnswer={(v) => answer(attr.id, v)} />
    </div>
  );
}

export default function Results() {
  const { t } = useTranslation();
  const { tx, lang } = useLang();
  const nav = useNavigate();
  const { answers, needs, toggleNeed, mode, familyMembers } = useSession();
  const hasAnswers = Object.keys(answers).length > 0;
  const res = useAsync(() => api.screen({ answers, needs }), [JSON.stringify(answers), needs.join()]);

  if (!hasAnswers) {
    return (
      <>
        <TopBar back="/" />
        <Column>
          <p className="py-12 text-lg">{t('results.noAnswers')}</p>
          <Button variant="primary" className="w-full" onClick={() => nav('/check')}>
            {t('results.startQuestions')}
          </Button>
        </Column>
      </>
    );
  }

  const all = res.data?.results ?? [];
  const shown = needs.length ? all.filter((r) => r.scheme.need && needs.includes(r.scheme.need)) : all;
  const g = (s: Ranked['status']) => shown.filter((r) => r.status === s);
  const eligible = g('eligible');
  const possibly = g('possibly');
  const already = g('already');
  const not = g('not');
  const totalEligible = all.filter((r) => r.status === 'eligible').length;

  const answeredAttrs = ATTRIBUTES.filter((a) => a.id in answers && a.kind !== 'multi');

  return (
    <>
      <TopBar
        back={mode === 'helping' ? '/sahayak' : '/check'}
        right={
          <nav className="flex">
            <Link to="/ask" className="inline-flex min-h-touch items-center px-2 text-sm underline decoration-line underline-offset-4">{t('nav.ask')}</Link>
            <Link to="/saved" className="inline-flex min-h-touch items-center px-2 text-sm underline decoration-line underline-offset-4">{t('nav.saved')}</Link>
          </nav>
        }
      />
      <Column
        bar={
          mode === 'helping' ? (
            <Button
              variant="primary"
              className="w-full"
              disabled={res.status !== 'ready'}
              onClick={() => void addFamily(answers, familyMembers ?? 1).then(() => nav('/sahayak'))}
            >
              {t('sahayak.saveFamily')}
            </Button>
          ) : (
            <Button variant="primary" className="w-full" onClick={() => nav('/saved')} disabled={res.status !== 'ready'}>
              {t('results.save')}
            </Button>
          )
        }
      >
        {res.status === 'error' ? (
          <ErrorState onRetry={res.retry} />
        ) : !res.data ? (
          <Loading />
        ) : (
          <>
            <h1 className="text-2xl font-semibold" aria-live="polite">
              {totalEligible === 0 ? t('results.titleNone') : t('results.title', { count: totalEligible })}
            </h1>

            <div className="mt-6">
              <p id="needs-label" className="mb-2 text-sm text-ink-2">
                {t('results.filter')}
              </p>
              <div role="group" aria-labelledby="needs-label" className="flex flex-wrap gap-2">
                {NEEDS.map((n) => {
                  const on = needs.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleNeed(n)}
                      className={`min-h-[40px] rounded-full border px-4 text-sm ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink'}`}
                    >
                      {t(`needs.${n}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {shown.length === 0 && <p className="mt-8 text-ink-2">{t('results.none')}</p>}

            {eligible.length > 0 && (
              <section className="mt-8" aria-label={t('results.eligible')}>
                <GroupHeading status="eligible">{t('results.eligible')}</GroupHeading>
                <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                  {eligible.map((r) => (
                    <li key={r.scheme.id}>
                      <SchemeRow scheme={r.scheme} status="eligible" line={firstSentence(tx(r.scheme.benefit))} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {possibly.length > 0 && (
              <section className="mt-8" aria-label={t('results.possibly')}>
                <GroupHeading status="possibly">{t('results.possibly')}</GroupHeading>
                <p className="mb-2 text-sm text-ink-2">{t('results.possiblyHelp')}</p>
                <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                  {possibly.map((r) => (
                    <li key={r.scheme.id}>
                      <SchemeRow scheme={r.scheme} status="possibly" line={firstSentence(tx(r.scheme.benefit))} />
                      <MiniQuestion r={r} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {already.length > 0 && (
              <details className="group mt-8">
                <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate">
                  <Glyph status="already" />
                  {t('results.already', { count: already.length })}
                </summary>
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                  {already.map((r) => (
                    <li key={r.scheme.id}>
                      <SchemeRow scheme={r.scheme} status="already" line={firstSentence(tx(r.scheme.benefit))} />
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {not.length > 0 && (
              <details className="mt-4">
                <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted">
                  <Glyph status="not" />
                  {t('results.not', { count: not.length })}
                </summary>
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                  {not.map((r) => (
                    <li key={r.scheme.id}>
                      <SchemeRow scheme={r.scheme} status="not" line={r.reason ? tx(r.reason.fail_label ?? r.reason.label) : ''} />
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <details className="mt-4">
              <summary className="flex min-h-touch cursor-pointer list-none items-center text-sm font-semibold text-ink-2">
                {t('results.yourAnswers')} ({answeredAttrs.length})
              </summary>
              <dl className="mt-2 divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
                {answeredAttrs.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2">
                    <dt className="flex-1 text-sm text-ink-2">{tx(ATTR_BY_ID[a.id]!.short)}</dt>
                    <dd className="text-sm">{answerLabel(a, answers[a.id], lang) ?? t('results.unknownAnswer')}</dd>
                    <dd>
                      <Link
                        to={`/check?edit=${a.id}`}
                        className="inline-flex min-h-touch items-center px-2 text-sm underline decoration-line underline-offset-4"
                        aria-label={`${t('results.edit')}: ${tx(a.short)}`}
                      >
                        {t('results.edit')}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </details>

            <p className="mt-8 text-sm text-ink-2">{t('results.footer')}</p>
          </>
        )}
      </Column>
    </>
  );
}
