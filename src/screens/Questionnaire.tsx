import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { api } from '@/api';
import { ATTR_BY_ID } from '@/data';
import { Button, Column, ErrorState, ICON, Loading, TopBar } from '@/components/ui';
import { QuestionInput } from '@/components/QuestionInput';
import { MicButton } from '@/components/MicButton';
import { useSession, type AnswerValue } from '@/store/session';
import { useAsync, useLang } from '@/lib/hooks';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';
import type { Attribute } from '@/engine/types';

const FORM_ID = 'question-form';

function spokenText(attr: Attribute, lang: 'en' | 'hi') {
  const opts = attr.options?.map((o) => o.label[lang]).join(', ');
  return opts ? `${attr.question[lang]} ${opts}` : attr.question[lang];
}

export default function Questionnaire() {
  const { t } = useTranslation();
  const { tx, lang } = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editAttr = params.get('edit');
  const { consent, answers, history, voice, answer, back } = useSession();

  const key = JSON.stringify(answers);
  const next = useAsync(() => api.next({ answers }), [key]);
  // Editing "which do you already get?" offers every scheme you qualify for.
  const eligibleNow = useAsync(
    () => (editAttr === 'already_receiving' ? api.screen({ answers: { ...answers, already_receiving: [] } }) : Promise.resolve(null)),
    [editAttr, key],
  );
  const editChoices = eligibleNow.data?.results.filter((r) => r.status === 'eligible').map((r) => r.scheme.id) ?? [];
  const q = editAttr
    ? { attr: editAttr, affectsCount: 0, affectedSchemes: editChoices, final: editAttr === 'already_receiving' }
    : next.data?.question;
  const attr = q ? ATTR_BY_ID[q.attr] : undefined;

  const done = !editAttr && next.status === 'ready' && next.data.question === null;
  useEffect(() => {
    if (done) nav('/results', { replace: true });
  }, [done, nav]);

  useEffect(() => {
    if (voice && attr && canSpeak()) speak(spokenText(attr, lang), lang);
    return () => stopSpeaking();
  }, [voice, attr, lang]);

  if (!consent) return <Navigate to="/" replace />;

  const onAnswer = (v: AnswerValue) => {
    if (!attr) return;
    answer(attr.id, v);
    if (editAttr) nav('/results');
  };

  const onBack = () => {
    if (editAttr) return nav('/results');
    if (history.length === 0) return nav('/');
    back();
  };

  const answered = history.filter((h) => h !== 'already_receiving').length;
  const remaining = next.data?.remaining ?? 0;
  const pct = answered + remaining > 0 ? Math.round((answered / (answered + remaining)) * 100) : 0;

  const needsSubmit = attr && (attr.kind === 'number' || attr.kind === 'multi');
  const bar = needsSubmit ? (
    <>
      <Button variant="primary" type="submit" form={FORM_ID} className="w-full">
        {attr.kind === 'multi' ? t('check.seeResults') : t('common.continue')}
      </Button>
      {attr.kind === 'multi' && (
        <Button variant="quiet" onClick={() => onAnswer([])} className="w-full">
          {t('check.skip')}
        </Button>
      )}
    </>
  ) : undefined;

  return (
    <>
      <TopBar back={onBack} title={editAttr ? t('check.editing') : t('check.title')} />
      {!editAttr && (
        <div className="no-print">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={t('check.progress', { count: remaining })}
            className="h-1 w-full bg-line"
          >
            <div className="progress-fill h-1 bg-ink" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <Column bar={bar}>
        {next.status === 'error' && !editAttr ? (
          <ErrorState onRetry={next.retry} />
        ) : !attr ? (
          <Loading />
        ) : (
          <div key={attr.id} className="q-enter">
            {!editAttr && remaining > 0 && <p className="mb-4 text-sm text-ink-2">{t('check.progress', { count: remaining })}</p>}
            <div className="flex items-start gap-2">
              <h1 id="q-title" className="flex-1 text-xl font-semibold">
                {tx(attr.question)}
              </h1>
              {canSpeak() && (
                <button
                  type="button"
                  onClick={() => speak(spokenText(attr, lang), lang)}
                  aria-label={t('common.readAloud')}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control text-ink-2 hover:bg-surface"
                >
                  <Volume2 {...ICON} aria-hidden="true" />
                </button>
              )}
            </div>
            {attr.help && <p className="mt-1 text-ink-2">{tx(attr.help)}</p>}
            {q && (q.final || q.affectsCount > 0) && (
              <p className="mt-2 text-sm text-ink-2">{q.final ? t('check.whyFinal') : t('check.why', { count: q.affectsCount })}</p>
            )}
            <div className="mt-6">
              <QuestionInput attr={attr} value={answers[attr.id]} onAnswer={onAnswer} choices={q?.affectedSchemes} formId={FORM_ID} />
            </div>
            <div className="mt-6">
              <MicButton attr={attr} onAnswer={onAnswer} />
            </div>
          </div>
        )}
      </Column>
    </>
  );
}
