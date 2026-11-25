import { useTranslation } from 'react-i18next';
import { Glyph, StatusTag, type Status } from '@/components/StatusGlyph';
import { SourceLine } from '@/components/SourceLine';
import { inr, inrWords } from '@/lib/format';

const COLOURS = ['paper', 'surface', 'line', 'ink', 'ink-2', 'green', 'green-tint', 'amber', 'amber-tint', 'slate', 'slate-tint', 'muted', 'danger'];
const SIZES: [string, string][] = [
  ['text-2xl', '30'],
  ['text-xl', '24'],
  ['text-lg', '20'],
  ['text-base', '17'],
  ['text-sm', '15'],
  ['text-xs', '13'],
];
const SPACE = [1, 2, 3, 4, 6, 8, 12];
const STATUSES: Status[] = ['eligible', 'possibly', 'already', 'not'];

export default function Tokens() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'hi';
  return (
    <main className="mx-auto max-w-column px-4 py-8" lang={lang}>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{t('tokens.title')}</h1>
        <div role="group" aria-label={t('lang.label')} className="inline-flex rounded-control border border-line bg-surface p-1">
          {(['en', 'hi'] as const).map((l) => (
            <button
              key={l}
              lang={l}
              aria-pressed={lang === l}
              onClick={() => void i18n.changeLanguage(l)}
              className={`min-h-touch rounded-control px-4 text-sm ${lang === l ? 'bg-ink text-surface' : 'text-ink'}`}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">{t('tokens.colours')}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {COLOURS.map((c) => (
            <li key={c} className="flex items-center gap-3 py-2">
              <span className="h-8 w-8 rounded-control border border-line" style={{ background: `var(--${c})` }} />
              <code className="text-xs">--{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">{t('tokens.type')}</h2>
        {SIZES.map(([cls, px]) => (
          <p key={cls} className={cls}>
            <span className="mr-2 font-mono text-xs text-ink-2">{px}</span>
            {t('tokens.sample')}
          </p>
        ))}
        <p className="mt-3 font-mono text-xs text-ink-2">
          {inr(120000)} · {inrWords(200000, lang)} · {inr(6000)}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">{t('tokens.status')}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {STATUSES.map((s) => (
            <li key={s} className="flex items-center justify-between py-3">
              <StatusTag status={s} />
              <Glyph status={s} size={32} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">{t('tokens.spacing')}</h2>
        {SPACE.map((s) => (
          <div key={s} className="flex items-center gap-3 py-1">
            <code className="w-8 text-xs text-ink-2">{s * 4}</code>
            <span className="h-3 bg-ink" style={{ width: s * 4 }} />
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">{t('tokens.controls')}</h2>
        <div className="flex flex-col gap-3">
          <button className="min-h-touch rounded-control bg-green px-4 font-medium text-surface">{t('tokens.primary')}</button>
          <button className="min-h-touch rounded-control border border-line bg-surface px-4 text-ink">{t('tokens.secondary')}</button>
          <div className="flex gap-2">
            <span className="rounded-full bg-green-tint px-3 py-1 text-xs text-green">{t('status.eligible')}</span>
            <span className="rounded-full bg-amber-tint px-3 py-1 text-xs text-amber">{t('status.possibly')}</span>
            <span className="rounded-full bg-slate-tint px-3 py-1 text-xs text-slate">{t('status.already')}</span>
          </div>
        </div>
      </section>

      <SourceLine url="https://pmkisan.gov.in" verified="2026-11-02" />
      <div className="h-4" />
      <SourceLine url="https://cmladlibahna.mp.gov.in" verified={null} />
    </main>
  );
}
