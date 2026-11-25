import { SCHEME_BY_ID, SCHEMES } from '@/data';
import { estimateRemaining, explainSkips, nextQuestion } from '@/engine/nextQuestion';
import { rank } from '@/engine/rank';
import { screen } from '@/engine/screen';
import type { SchemeApi } from './types';

/** Runs the TypeScript engine on the bundled JSON, in the browser. Works offline. */
export const localApi: SchemeApi = {
  mode: 'local',
  async listSchemes() {
    return SCHEMES;
  },
  async getScheme(id) {
    return SCHEME_BY_ID[id] ?? null;
  },
  async screen({ answers, needs, weights }) {
    return { results: rank(screen(answers), { needs, weights }) };
  },
  async next({ answers }) {
    const question = nextQuestion(answers);
    return { question, remaining: question ? estimateRemaining(answers) : 0, skips: explainSkips(answers) };
  },
};
