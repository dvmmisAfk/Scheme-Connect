import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Mic } from 'lucide-react';
import { Column, ICON, LangSegmented } from '@/components/ui';
import { useSession } from '@/store/session';
import { canListen } from '@/lib/speech';

export default function Onboarding() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const consent = useSession((s) => s.consent);
  const setConsent = useSession((s) => s.setConsent);
  const start = useSession((s) => s.start);
  const [nudge, setNudge] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState(false);

  const go = (mode: 'self' | 'helping', voice = false) => {
    if (!consent) {
      setNudge(true);
      document.getElementById('consent')?.focus();
      return;
    }
    start(mode, voice);
    nav(mode === 'self' ? '/check' : '/sahayak');
  };

  const speak = () => {
    if (!canListen()) {
      setVoiceMsg(true);
      return;
    }
    go('self', true);
  };

  return (
    <Column>
      <h1 className="text-xl font-semibold tracking-tight">{t('app.name')}</h1>
      <p className="mt-2 text-lg text-ink">{t('app.tagline')}</p>

      <div className="mt-8">
        <LangSegmented />
      </div>

      <button
        type="button"
        onClick={speak}
        className="mt-4 flex min-h-[64px] w-full items-center gap-3 rounded-control border border-ink bg-surface px-4 text-left"
      >
        <Mic {...ICON} aria-hidden="true" />
        <span>
          <span className="block text-base font-medium">{t('onboarding.speak')}</span>
          <span className="block text-sm text-ink-2">{t('onboarding.speakHelp')}</span>
        </span>
      </button>
      {voiceMsg && (
        <p role="status" className="mt-2 text-sm text-ink-2">
          {t('common.voiceUnsupported')}
        </p>
      )}

      <label className={`mt-8 flex cursor-pointer gap-3 rounded-control border bg-surface p-4 ${nudge && !consent ? 'border-danger' : 'border-line'}`}>
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setNudge(false);
          }}
          aria-describedby={nudge && !consent ? 'consent-err' : undefined}
          className="mt-1 h-[20px] w-[20px] shrink-0 accent-[var(--green)]"
        />
        <span className="text-base">{t('onboarding.consent')}</span>
      </label>
      {nudge && !consent && (
        <p id="consent-err" role="alert" className="mt-2 text-sm text-danger">
          {t('onboarding.consentNeeded')}
        </p>
      )}

      <h2 className="mb-2 mt-8 text-sm font-semibold text-ink-2">{t('onboarding.who')}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
        {(['self', 'helping'] as const).map((m) => (
          <li key={m}>
            <button type="button" onClick={() => go(m)} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
              <span className="flex-1">
                <span className="block text-base font-medium">{t(`onboarding.${m}`)}</span>
                <span className="block text-sm text-ink-2">{t(`onboarding.${m}Help`)}</span>
              </span>
              <ChevronRight {...ICON} aria-hidden="true" className="text-ink-2" />
            </button>
          </li>
        ))}
      </ul>
    </Column>
  );
}
