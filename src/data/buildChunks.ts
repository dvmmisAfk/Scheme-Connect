import { isLeaf } from '@/engine/evaluate';
import type { Lang, RuleNode, Scheme, Text } from '@/engine/types';

export interface Chunk {
  id: string;
  scheme_id: string;
  field: 'eligibility' | 'benefit' | 'documents' | 'how_to_apply';
  title: Text;
  text: Text;
  source_url: string;
  source_label: string;
}

const OR: Text = { en: ' or ', hi: ' या ' };

function describe(node: RuleNode, lang: Lang): string {
  if (isLeaf(node)) return node.label[lang];
  if ('not' in node) return (lang === 'en' ? 'not: ' : 'नहीं: ') + describe(node.not, lang);
  if ('all' in node) return node.all.map((n) => describe(n, lang)).join('; ');
  return '(' + node.any.map((n) => describe(n, lang)).join(OR[lang]) + ')';
}

const both = (f: (l: Lang) => string): Text => ({ en: f('en'), hi: f('hi') });

/** Chunks for the Ask index: one per scheme field, each tagged with the scheme's source. */
export function buildChunks(schemes: Scheme[]): Chunk[] {
  const out: Chunk[] = [];
  for (const s of schemes) {
    const meta = { scheme_id: s.id, source_url: s.source_url, source_label: s.source_label };
    const name = (l: Lang) => `${s.name[l]} (${s.short})`;
    out.push({
      id: `${s.id}#eligibility`, field: 'eligibility', ...meta,
      title: both((l) => `${name(l)}: ${l === 'en' ? 'who can get it' : 'किसे मिल सकती है'}`),
      text: both((l) => describe(s.rule, l) + '.'),
    });
    out.push({
      id: `${s.id}#benefit`, field: 'benefit', ...meta,
      title: both((l) => `${name(l)}: ${l === 'en' ? 'what you get' : 'क्या मिलता है'}`),
      text: both((l) => s.benefit[l] + (s.benefit_note ? ` ${s.benefit_note[l]}.` : '')),
    });
    out.push({
      id: `${s.id}#documents`, field: 'documents', ...meta,
      title: both((l) => `${name(l)}: ${l === 'en' ? 'documents' : 'दस्तावेज़'}`),
      text: both((l) => s.documents.map((d) => d.text[l]).join(', ') + '.'),
    });
    if (s.how_to_apply) {
      const how = s.how_to_apply;
      out.push({
        id: `${s.id}#how_to_apply`, field: 'how_to_apply', ...meta,
        title: both((l) => `${name(l)}: ${l === 'en' ? 'how to apply' : 'आवेदन कैसे करें'}`),
        text: both((l) => how[l]),
      });
    }
  }
  return out;
}
