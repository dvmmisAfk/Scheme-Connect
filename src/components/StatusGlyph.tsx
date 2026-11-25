import { useTranslation } from 'react-i18next';

export type Status = 'eligible' | 'possibly' | 'already' | 'not';

const colour: Record<Status, string> = {
  eligible: 'var(--green)',
  possibly: 'var(--amber)',
  already: 'var(--slate)',
  not: 'var(--muted)',
};

/** Glyph only. Always pair with a word (see StatusTag), never colour alone. */
export function Glyph({ status, size = 20 }: { status: Status; size?: number }) {
  const c = colour[status];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="shrink-0">
      {status === 'eligible' && (
        <>
          <circle cx="10" cy="10" r="9" fill={c} />
          <path d="M6 10.2l2.7 2.7L14 7.6" fill="none" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {status === 'possibly' && (
        <>
          <circle cx="10" cy="10" r="8.25" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M10 1.75a8.25 8.25 0 0 1 0 16.5z" fill={c} />
        </>
      )}
      {status === 'already' && (
        <>
          <rect x="1.75" y="1.75" width="16.5" height="16.5" rx="3" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M6 10.2l2.7 2.7L14 7.6" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {status === 'not' && (
        <>
          <circle cx="10" cy="10" r="8.25" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M6.5 10h7" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const textClass: Record<Status, string> = {
  eligible: 'text-green',
  possibly: 'text-amber',
  already: 'text-slate',
  not: 'text-muted',
};

/** Glyph + word + colour together. */
export function StatusTag({ status, size = 20 }: { status: Status; size?: number }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${textClass[status]}`}>
      <Glyph status={status} size={size} />
      {t(`status.${status}`)}
    </span>
  );
}
