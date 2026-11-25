import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { Button, Column, Loading, SectionTitle, TopBar } from '@/components/ui';
import { SchemeRow } from '@/components/SchemeRow';
import { useSession } from '@/store/session';
import { deleteSaved, KEEP_DAYS, loadSaved, saveResults } from '@/store/saved';
import { useAsync, useLang } from '@/lib/hooks';
import { firstSentence, stampDate } from '@/lib/format';

export default function Saved() {
  const { t } = useTranslation();
  const { tx } = useLang();
  const nav = useNavigate();
  const answers = useSession((s) => s.answers);
  const loadAnswers = useSession((s) => s.loadAnswers);
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const saved = useAsync(() => loadSaved(), []);
  const eligible = useAsync(
    () => (saved.data ? api.screen({ answers: saved.data.answers }) : Promise.resolve(null)),
    [saved.data?.savedAt],
  );

  const hasSession = Object.keys(answers).length > 0;

  const doSave = async () => {
    try {
      await saveResults(answers);
      setMsg(null);
      saved.retry();
    } catch {
      setMsg(t('saved.storageError'));
    }
  };
  const doDelete = async () => {
    try {
      await deleteSaved();
      setMsg(t('saved.deleted'));
      saved.retry();
    } catch {
      setMsg(t('saved.storageError'));
    }
  };

  let body: React.ReactNode;
  let bar: React.ReactNode;

  if (saved.status === 'loading' && !saved.data) body = <Loading />;
  else if (saved.status === 'error') body = <p role="alert" className="py-8">{t('saved.storageError')}</p>;
  else if (saved.data) {
    const s = saved.data;
    const list = eligible.data?.results.filter((r) => r.status === 'eligible') ?? [];
    body = (
      <>
        <p className="text-ink-2">{t('saved.savedOn', { date: stampDate(s.savedAt) })}</p>
        <p className="mt-1 font-medium">{t('saved.expires', { date: stampDate(s.expiresAt) })}</p>
        {list.length > 0 && (
          <section className="mt-8">
            <SectionTitle>{t('results.title', { count: list.length })}</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
              {list.map((r) => (
                <li key={r.scheme.id}>
                  <SchemeRow scheme={r.scheme} status="eligible" line={firstSentence(tx(r.scheme.benefit))} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <Button variant="danger" className="mt-8 w-full" onClick={doDelete}>
          {t('saved.deleteNow')}
        </Button>
      </>
    );
    bar = (
      <Button
        variant="primary"
        className="w-full"
        onClick={() => {
          loadAnswers(s.answers);
          nav('/results');
        }}
      >
        {t('saved.open')}
      </Button>
    );
  } else if (hasSession) {
    body = (
      <>
        <p className="text-ink-2">{t('saved.none')}</p>
        <label className="mt-6 flex cursor-pointer gap-3 rounded-control border border-line bg-surface p-4">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-[20px] w-[20px] shrink-0 accent-[var(--green)]" />
          <span>{t('saved.consent', { days: KEEP_DAYS })}</span>
        </label>
      </>
    );
    bar = (
      <Button variant="primary" className="w-full" disabled={!agree} onClick={doSave}>
        {t('saved.save')}
      </Button>
    );
  } else {
    body = (
      <>
        <p className="py-8 text-ink-2">{t('saved.none')}</p>
        <Button className="w-full" onClick={() => nav('/')}>
          {t('results.startQuestions')}
        </Button>
      </>
    );
  }

  return (
    <>
      <TopBar back={hasSession ? '/results' : '/'} title={t('saved.title')} />
      <Column bar={bar}>
        <h1 className="mb-4 text-2xl font-semibold">{t('saved.title')}</h1>
        {msg && (
          <p role="status" className="mb-4 text-sm">
            {msg}
          </p>
        )}
        {body}
      </Column>
    </>
  );
}
