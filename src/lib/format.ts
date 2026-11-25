/** Indian digit grouping: 120000 -> "₹1,20,000". */
export function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

/** In sentences: 200000 -> "₹2 lakh", 150000 -> "₹1.5 lakh". Below 1 lakh, grouped digits. */
export function inrWords(n: number, lang: 'en' | 'hi' = 'en'): string {
  if (n >= 100000) {
    const l = n / 100000;
    const s = Number.isInteger(l) ? String(l) : l.toFixed(2).replace(/\.?0+$/, '');
    return `₹${s} ${lang === 'hi' ? 'लाख' : 'lakh'}`;
  }
  return inr(n);
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "02 Nov 2026": the stamped-date format used on source lines. */
export function stampDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`;
}

/** First sentence, for one-line benefit summaries. Handles "." and the Devanagari danda "।". */
export function firstSentence(s: string): string {
  const m = s.match(/^.*?[.।](?=\s|$)/);
  return m ? m[0] : s;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}
