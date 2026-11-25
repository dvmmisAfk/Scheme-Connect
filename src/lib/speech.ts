import type { Lang, Option } from '@/engine/types';

/* Browser voice (Web Speech API). BHASHINI replaces this in Phase II. */

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = () => ctor() !== null;
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const bcp = (l: Lang) => (l === 'hi' ? 'hi-IN' : 'en-IN');

/** Listen once. Resolves with the best transcripts, rejects on error or silence. */
export function listen(lang: Lang): { promise: Promise<string[]>; stop: () => void } {
  const C = ctor();
  if (!C) return { promise: Promise.reject(new Error('unsupported')), stop: () => {} };
  const r = new C();
  r.lang = bcp(lang);
  r.interimResults = false;
  r.maxAlternatives = 3;
  const promise = new Promise<string[]>((resolve, reject) => {
    let done = false;
    r.onresult = (e) => {
      done = true;
      const alts = e.results[0];
      resolve(alts ? Array.from({ length: alts.length }, (_, i) => alts[i]!.transcript) : []);
    };
    r.onerror = (e) => {
      done = true;
      reject(new Error(e.error));
    };
    r.onend = () => {
      if (!done) reject(new Error('no-speech'));
    };
  });
  r.start();
  return { promise, stop: () => r.abort() };
}

export function speak(text: string, lang: Lang) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp(lang);
  const v = window.speechSynthesis.getVoices().find((x) => x.lang === u.lang);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/[.,!?।'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SYNONYMS: Record<string, string[]> = {
  true: ['yes', 'haan', 'han', 'ha', 'ji', 'हाँ', 'हां', 'जी', 'है'],
  false: ['no', 'nahi', 'nahin', 'नहीं', 'ना', 'नही'],
  null: ["don't know", 'dont know', 'do not know', 'not sure', 'pata nahi', 'पता नहीं', 'मालूम नहीं', 'नहीं पता'],
};

/** Map spoken words to one of the options, or a number for number questions. */
export function matchSpoken(transcripts: string[], options: Option[] | undefined): { value: Option['value'] } | { number: number } | null {
  for (const raw of transcripts) {
    const t = norm(raw);
    if (!options) {
      const m = t.match(/\d+(\.\d+)?/);
      if (m) return { number: Number(m[0]) };
      continue;
    }
    // "don't know" first: it contains "no"/"नहीं".
    if (SYNONYMS.null!.some((w) => t.includes(w))) {
      const dk = options.find((o) => o.value === null);
      if (dk) return { value: null };
    }
    for (const o of options) {
      for (const l of [o.label.en, o.label.hi]) {
        const ln = norm(l);
        if (ln && (t === ln || t.includes(ln) || (ln.split(' ')[0]!.length > 2 && t.includes(ln.split(' ')[0]!)))) return { value: o.value };
      }
    }
    const key = String(true);
    if (SYNONYMS[key]!.some((w) => t.split(' ').includes(w))) {
      if (options.some((o) => o.value === true)) return { value: true };
    }
    if (SYNONYMS.false!.some((w) => t.split(' ').includes(w))) {
      if (options.some((o) => o.value === false)) return { value: false };
    }
  }
  return null;
}
