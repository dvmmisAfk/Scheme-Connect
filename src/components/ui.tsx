import { Component, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, WifiOff } from 'lucide-react';
import { useOnline } from '@/lib/hooks';

export const ICON = { size: 20, strokeWidth: 1.5 } as const;

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' };

const VARIANTS = {
  primary: 'bg-green text-surface hover:brightness-110 disabled:opacity-50',
  secondary: 'border border-line bg-surface text-ink hover:border-ink-2',
  quiet: 'text-ink underline decoration-line underline-offset-4 hover:decoration-ink',
  danger: 'border border-danger bg-surface text-danger hover:bg-paper',
};

export function Button({ variant = 'secondary', className = '', ...p }: BtnProps) {
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex min-h-touch items-center justify-center gap-2 rounded-control px-4 text-base font-medium ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function LangToggle() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  return (
    <div role="group" aria-label={t('lang.label')} className="inline-flex rounded-control border border-line bg-surface p-1">
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          aria-label={t(`lang.${l}`)}
          onClick={() => void i18n.changeLanguage(l)}
          className={`min-h-[40px] min-w-[44px] rounded-[7px] px-3 text-sm ${lang === l ? 'bg-ink text-surface' : 'text-ink'}`}
        >
          {t(`lang.short_${l}`)}
        </button>
      ))}
    </div>
  );
}

/** Full-size Hindi / English segmented control for onboarding. */
export function LangSegmented() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  return (
    <div role="group" aria-label={t('lang.label')} className="grid grid-cols-2 rounded-control border border-line bg-surface p-1">
      {(['hi', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => void i18n.changeLanguage(l)}
          className={`min-h-touch rounded-[7px] text-base ${lang === l ? 'bg-ink font-medium text-surface' : 'text-ink'}`}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}

export function TopBar({ title, back, right }: { title?: ReactNode; back?: string | (() => void); right?: ReactNode }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <header className="no-print sticky top-0 z-10 flex min-h-[56px] items-center gap-2 border-b border-line bg-paper px-2">
      {back ? (
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => (typeof back === 'string' ? nav(back) : back())}
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control text-ink hover:bg-surface"
        >
          <ChevronLeft {...ICON} aria-hidden="true" />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <div className="min-w-0 flex-1 truncate text-sm font-medium">{title}</div>
      {right}
      <LangToggle />
    </header>
  );
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="no-print flex items-center gap-2 border-b border-line bg-surface px-4 py-2 text-sm text-ink-2">
      <WifiOff {...ICON} aria-hidden="true" />
      {t('common.offline')}
    </div>
  );
}

/** Citizen layout: centred 440px column. `bar` is the sticky bottom action area. */
export function Column({ children, bar }: { children: ReactNode; bar?: ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-column px-4 pb-8 pt-6">{children}</main>
      {bar && (
        <div className="no-print sticky bottom-0 z-10 border-t border-line bg-paper">
          <div className="mx-auto flex w-full max-w-column flex-col gap-2 px-4 py-3">{bar}</div>
        </div>
      )}
    </>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-2 text-sm font-semibold text-ink-2">
      {children}
    </h2>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <p role="status" className="py-12 text-ink-2">
      {t('common.loading')}
    </p>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="py-12">
      <p className="text-lg font-medium">{t('common.error')}</p>
      <p className="mt-1 text-ink-2">{t('common.errorHelp')}</p>
      <div className="mt-6 flex flex-col gap-2">
        {onRetry && <Button onClick={onRetry}>{t('common.tryAgain')}</Button>}
        <Button variant="quiet" onClick={() => (window.location.href = '/')}>
          {t('common.startAgain')}
        </Button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <main className="mx-auto max-w-column px-4">
          <ErrorState onRetry={() => this.setState({ failed: false })} />
        </main>
      );
    }
    return this.props.children;
  }
}
