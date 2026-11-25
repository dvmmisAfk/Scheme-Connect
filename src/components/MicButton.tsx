import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic } from 'lucide-react';
import type { Attribute } from '@/engine/types';
import type { AnswerValue } from '@/store/session';
import { canListen, listen, matchSpoken } from '@/lib/speech';
import { useLang } from '@/lib/hooks';
import { ICON } from './ui';

/** Mic for voice answers. Matches what was said to an option (or a number), then answers. */
export function MicButton({ attr, onAnswer }: { attr: Attribute; onAnswer: (v: AnswerValue) => void }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [state, setState] = useState<'idle' | 'listening' | 'missed' | 'unsupported'>('idle');
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopRef.current(), []);
  useEffect(() => {
    setState('idle');
  }, [attr.id]);

  if (attr.kind === 'multi') return null;

  const go = () => {
    if (!canListen()) {
      setState('unsupported');
      return;
    }
    if (state === 'listening') {
      stopRef.current();
      setState('idle');
      return;
    }
    setState('listening');
    const { promise, stop } = listen(lang);
    stopRef.current = stop;
    promise
      .then((ts) => {
        const m = matchSpoken(ts, attr.options);
        if (!m) return setState('missed');
        setState('idle');
        onAnswer('number' in m ? m.number : m.value);
      })
      .catch(() => setState('missed'));
  };

  const msg =
    state === 'listening' ? t('common.listening') : state === 'missed' ? t('common.notUnderstood') : state === 'unsupported' ? t('common.voiceUnsupported') : null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={go}
        aria-label={t('common.mic')}
        aria-pressed={state === 'listening'}
        className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border ${state === 'listening' ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink'}`}
      >
        <Mic {...ICON} aria-hidden="true" />
      </button>
      <p aria-live="polite" className="text-sm text-ink-2">
        {msg}
      </p>
    </div>
  );
}
