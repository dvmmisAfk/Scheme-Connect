import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { Scheme, ScreenStatus } from '@/engine/types';
import { useLang } from '@/lib/hooks';
import { Glyph } from './StatusGlyph';
import { ICON } from './ui';

export function EnrolmentTag({ scheme }: { scheme: Scheme }) {
  const { t } = useTranslation();
  if (scheme.enrolment_status === 'open') return null;
  return (
    <span className="mt-1 inline-block rounded-full border border-line px-2 text-xs text-ink-2">
      {scheme.enrolment_status === 'closed' ? t('results.closed') : t('results.viaSurvey')}
    </span>
  );
}

/** One scheme in a results list: glyph, name, one line of benefit or reason. Links to the detail page. */
export function SchemeRow({ scheme, status, line }: { scheme: Scheme; status: ScreenStatus; line: string }) {
  const { t } = useTranslation();
  const { tx } = useLang();
  return (
    <Link to={`/scheme/${scheme.id}`} className="flex min-h-[64px] items-start gap-3 px-4 py-3 hover:bg-paper">
      <span className="pt-[3px]">
        <Glyph status={status} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="sr-only">{t(`status.${status}`)}: </span>
        <span className="block font-medium">{tx(scheme.name)}</span>
        <span className="block text-sm text-ink-2">{line}</span>
        <EnrolmentTag scheme={scheme} />
      </span>
      <ChevronRight {...ICON} aria-hidden="true" className="mt-[3px] shrink-0 text-ink-2" />
    </Link>
  );
}
