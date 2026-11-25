import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { SCHEME_BY_ID } from '@/data';
import type { Attribute, Option } from '@/engine/types';
import type { AnswerValue } from '@/store/session';
import { useLang } from '@/lib/hooks';
import { Button, ICON } from './ui';

interface Props {
  attr: Attribute;
  /** Current answer, if any (for editing). */
  value: AnswerValue | undefined;
  onAnswer: (v: AnswerValue) => void;
  /** For the multi-select final step: schemes to offer. */
  choices?: string[];
  /** Compact = inline mini-question on the results screen. */
  compact?: boolean;
  /** For number / multi questions: id of the form, so a sticky-bar button can submit it. */
  formId?: string;
}

function OptionRows({ options, value, onPick, compact, labelledBy }: { options: Option[]; value: AnswerValue | undefined; onPick: (o: Option) => void; compact?: boolean; labelledBy?: string }) {
  const { tx, lang } = useLang();
  if (compact) {
    // Inline in a list row: chips, so we never nest a bordered list inside another.
    return (
      <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const selected = value !== undefined && value === o.value;
          return (
            <button
              key={i}
              type="button"
              lang={lang}
              aria-pressed={selected}
              onClick={() => onPick(o)}
              className={`min-h-touch rounded-full border px-4 text-sm ${selected ? 'border-ink bg-ink text-surface' : o.value === null ? 'border-line bg-surface text-ink-2' : 'border-line bg-surface text-ink'}`}
            >
              {tx(o.label)}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <ul role="list" aria-labelledby={labelledBy} className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
      {options.map((o, i) => {
        const selected = value !== undefined && value === o.value;
        const isDk = o.value === null;
        return (
          <li key={i}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onPick(o)}
              lang={lang}
              className={`flex w-full items-center justify-between gap-3 px-4 text-left ${compact ? 'min-h-touch py-2 text-sm' : 'min-h-[56px] py-3 text-base'} ${isDk ? 'text-ink-2' : 'text-ink'} hover:bg-paper`}
            >
              <span>{tx(o.label)}</span>
              {selected && <Check {...ICON} aria-hidden="true" className="shrink-0 text-ink" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function QuestionInput({ attr, value, onAnswer, choices, compact, formId }: Props) {
  const { t } = useTranslation();
  const { tx, lang } = useLang();
  const autoId = useId();
  const fid = formId ?? `q-${autoId}`;
  const [num, setNum] = useState(typeof value === 'number' ? String(value) : '');
  const [picked, setPicked] = useState<string[]>(Array.isArray(value) ? value : []);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setNum(typeof value === 'number' ? String(value) : '');
    setPicked(Array.isArray(value) ? value : []);
    setErr(null);
  }, [attr.id, value]);

  if (attr.options) {
    return <OptionRows options={attr.options} value={value} onPick={(o) => onAnswer(o.value)} compact={compact} />;
  }

  if (attr.kind === 'number') {
    const min = attr.min ?? 0;
    const max = attr.max ?? 999;
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      const n = Number(num.replace(',', '.'));
      if (num.trim() === '' || !Number.isFinite(n) || n < min || n > max) {
        setErr(t('check.numberInvalid', { min, max }));
        return;
      }
      onAnswer(n);
    };
    return (
      <form id={fid} onSubmit={submit} noValidate>
        <label htmlFor={`${fid}-n`} className="sr-only">
          {t('check.numberLabel')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={`${fid}-n`}
            inputMode="decimal"
            autoComplete="off"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? `${fid}-err` : undefined}
            className={`min-h-touch w-[128px] rounded-control border bg-surface px-4 tabular-nums ${compact ? 'text-base' : 'text-xl'} ${err ? 'border-danger' : 'border-line'}`}
          />
          <span className="text-ink-2" lang={lang}>{tx(attr.unit)}</span>
          {compact && (
            <Button type="submit" className="ml-auto">
              {t('common.continue')}
            </Button>
          )}
        </div>
        {err && (
          <p id={`${fid}-err`} role="alert" className="mt-2 text-sm text-danger">
            {err}
          </p>
        )}
        <button type="button" onClick={() => onAnswer(null)} className={`mt-3 min-h-touch text-left text-ink-2 underline decoration-line underline-offset-4 ${compact ? 'text-sm' : 'text-base'}`}>
          {t('common.dontKnow')}
        </button>
      </form>
    );
  }

  if (attr.kind === 'multi') {
    const ids = choices ?? [];
    return (
      <form
        id={fid}
        onSubmit={(e) => {
          e.preventDefault();
          onAnswer(picked);
        }}
      >
        <fieldset>
          <legend className="sr-only">{tx(attr.question)}</legend>
          <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
            {ids.map((id) => {
              const s = SCHEME_BY_ID[id];
              if (!s) return null;
              const on = picked.includes(id);
              return (
                <li key={id}>
                  <label className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setPicked(on ? picked.filter((x) => x !== id) : [...picked, id])}
                      className="h-[20px] w-[20px] shrink-0 accent-[var(--ink)]"
                    />
                    <span lang={lang}>{tx(s.name)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </form>
    );
  }
  return null;
}
