import { del, get, set } from 'idb-keyval';
import type { Answers } from '@/engine/types';

/** Opt-in saved results, kept in IndexedDB on this device only, deleted after KEEP_DAYS. */
export const KEEP_DAYS = 30;
const KEY = 'sc.saved';

export interface Saved {
  answers: Answers;
  savedAt: string;
  expiresAt: string;
}

export async function loadSaved(now = new Date()): Promise<Saved | null> {
  const s = await get<Saved>(KEY);
  if (!s) return null;
  if (new Date(s.expiresAt) <= now) {
    await del(KEY);
    return null;
  }
  return s;
}

export async function saveResults(answers: Answers, now = new Date()): Promise<Saved> {
  const s: Saved = {
    answers,
    savedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + KEEP_DAYS * 86_400_000).toISOString(),
  };
  await set(KEY, s);
  return s;
}

export const deleteSaved = () => del(KEY);
