import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mic, Send, Volume2 } from 'lucide-react';
import { ask } from '@/ask/search';
import type { Chunk } from '@/data/buildChunks';
import { Column, ICON, TopBar } from '@/components/ui';
import { useLang } from '@/lib/hooks';
import { canListen, canSpeak, listen, speak } from '@/lib/speech';
import { hostOf } from '@/lib/format';

interface Msg {
  from: 'user' | 'bot';
  text: string;
  chunks?: Chunk[];
}

export default function Ask() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Block body on purpose: an effect must not return scrollIntoView's result.
    if (msgs.length) end.current?.scrollIntoView?.({ block: 'end' });
  }, [msgs]);

  const submit = (text: string) => {
    const query = text.trim();
    if (!query) return;
    const r = ask(query, lang);
    const reply: Msg = r.found
      ? { from: 'bot', text: r.chunks.map((c) => `${c.title[lang]}. ${c.text[lang]}`).join('\n\n'), chunks: r.chunks }
      : { from: 'bot', text: t('ask.noAnswer') };
    setMsgs((m) => [...m, { from: 'user', text: query }, reply]);
    setQ('');
  };

  const mic = () => {
    if (!canListen()) return setMsgs((m) => [...m, { from: 'bot', text: t('common.voiceUnsupported') }]);
    setListening(true);
    listen(lang)
      .promise.then((ts) => ts[0] && submit(ts[0]))
      .catch(() => {})
      .finally(() => setListening(false));
  };

  return (
    <>
      <TopBar back="/results" title={<>{t('ask.title')} <span className="ml-1 rounded-full border border-line px-2 text-xs text-ink-2">{t('ask.preview')}</span></>} />
      <Column
        bar={
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(q);
            }}
          >
            <button type="button" onClick={mic} aria-label={t('common.mic')} aria-pressed={listening} className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border ${listening ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'}`}>
              <Mic {...ICON} aria-hidden="true" />
            </button>
            <label htmlFor="ask-q" className="sr-only">{t('ask.placeholder')}</label>
            <input id="ask-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ask.placeholder')} className="min-h-touch min-w-0 flex-1 rounded-control border border-line bg-surface px-4" />
            <button type="submit" aria-label={t('ask.send')} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control bg-green text-surface">
              <Send {...ICON} aria-hidden="true" />
            </button>
          </form>
        }
      >
        {msgs.length === 0 && (
          <div>
            <p className="text-lg">{t('ask.intro')}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {(t('ask.examples', { returnObjects: true }) as string[]).map((ex) => (
                <li key={ex}>
                  <button type="button" onClick={() => submit(ex)} className="min-h-touch rounded-full border border-line bg-surface px-4 text-left text-sm">
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-2">{t('ask.voiceNote')}</p>
          </div>
        )}
        <ol className="flex flex-col gap-4" aria-live="polite">
          {msgs.map((m, i) => (
            <li key={i} className={m.from === 'user' ? 'ml-12 self-end rounded-control bg-ink px-4 py-2 text-surface' : 'mr-4 rounded-control border border-line bg-surface px-4 py-3'}>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.from === 'bot' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {m.chunks?.slice(0, 1).map((c) => (
                    <Link key={c.id} to={`/scheme/${c.scheme_id}`} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-2">
                      {t('ask.cite', { host: hostOf(c.source_url) })}
                    </Link>
                  ))}
                  {canSpeak() && (
                    <button type="button" onClick={() => speak(m.text, lang)} aria-label={t('common.readAloud')} className="ml-auto inline-flex min-h-touch min-w-touch items-center justify-center text-ink-2">
                      <Volume2 {...ICON} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div ref={end} />
      </Column>
    </>
  );
}
