import MiniSearch from 'minisearch';
import chunksJson from '@/data/chunks.json';
import { SCHEMES } from '@/data';
import type { Chunk } from '@/data/buildChunks';
import type { Lang } from '@/engine/types';

const CHUNKS = chunksJson as Chunk[];

const STOP: Record<Lang, Set<string>> = {
  en: new Set('a an the is are am i me my we you your to of for in on at and or do does can could how what which who where when will would should get about it this that be with from there any much many'.split(' ')),
  hi: new Set('है हैं का की के को में से क्या कैसे मुझे मेरा मेरी मैं हम आप आपका कौन कौन-सी कहाँ कब और या यह ये वह इस उस पर भी तो कितना कितनी कितने मिलेगा मिलेगी मिल सकता सकती सकते चाहिए होता होती'.split(' ')),
};

/** Below this BM25 score we say we don't have an official answer. Tuned on src/ask/search.test.ts. */
export const MIN_SCORE = 10;

const byScheme = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));

const indexes: Partial<Record<Lang, MiniSearch>> = {};
function index(lang: Lang): MiniSearch {
  if (indexes[lang]) return indexes[lang]!;
  const ms = new MiniSearch({
    fields: ['names', 'title', 'text'],
    storeFields: ['id'],
    processTerm: (t) => {
      const x = t.toLowerCase();
      return STOP[lang].has(x) || STOP.en.has(x) ? null : x;
    },
    searchOptions: { boost: { names: 3, title: 2 }, fuzzy: 0.2, prefix: (t) => t.length > 3 },
  });
  ms.addAll(
    CHUNKS.map((c) => {
      const s = byScheme[c.scheme_id]!;
      return { id: c.id, names: `${s.short} ${s.name.en} ${s.name.hi}`, title: c.title[lang], text: c.text[lang] };
    }),
  );
  indexes[lang] = ms;
  return ms;
}

export interface AskAnswer {
  found: boolean;
  chunks: Chunk[];
  score: number;
}

/** BM25 search over the knowledge base. Returns the top 1–2 chunks, or found=false below the threshold. */
export function ask(query: string, lang: Lang): AskAnswer {
  const hits = index(lang).search(query);
  const top = hits[0];
  if (!top || top.score < MIN_SCORE) return { found: false, chunks: [], score: top?.score ?? 0 };
  const chunks = [CHUNKS.find((c) => c.id === top.id)!];
  const second = hits[1];
  if (second && second.score >= top.score * 0.6) {
    const c = CHUNKS.find((x) => x.id === second.id)!;
    if (c.scheme_id === chunks[0]!.scheme_id) chunks.push(c);
  }
  return { found: true, chunks, score: top.score };
}
