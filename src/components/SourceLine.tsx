import { useTranslation } from 'react-i18next';
import { hostOf, stampDate } from '@/lib/format';

/** Thin rule + mono line. The product's proof of trust; identical everywhere. */
export function SourceLine({ url, verified }: { url: string; verified: string | null }) {
  const { t } = useTranslation();
  const host = hostOf(url);
  return (
    <p className="source-line">
      <a href={url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink-2">
        {verified ? t('source.line', { host, date: stampDate(verified) }) : t('source.unverified', { host })}
      </a>
    </p>
  );
}
