import { get, set } from 'idb-keyval';
import type { Answers } from '@/engine/types';
import { PERSONAS } from '@/engine/personas';
import { bucketFor } from '@/engine/buckets';

/** Sahayak screenings. No names: families are labelled by number and role only. Kept in IndexedDB on this device. */
export interface Family {
  id: string;
  n: number;
  members: number;
  answers: Answers;
  screenedAt: string;
}

const KEY = 'sc.families';
export const CENTRE_LABEL = 'CSC Ashta, Sehore';

export const listFamilies = async (): Promise<Family[]> => (await get<Family[]>(KEY)) ?? [];

export async function addFamily(answers: Answers, members: number): Promise<Family> {
  const all = await listFamilies();
  const f: Family = { id: crypto.randomUUID(), n: all.length + 1, members, answers, screenedAt: new Date().toISOString() };
  await set(KEY, [...all, f]);
  return f;
}

export const clearFamilies = () => set(KEY, []);

/** Demo seed for the viva: four personas, incomes as the buckets a family would tick. */
export async function seedDemo(): Promise<void> {
  const seeds: [string, number][] = [['P1', 5], ['P2', 4], ['P4', 4], ['P7', 3]];
  for (const [pid, members] of seeds) {
    const a: Answers = { ...PERSONAS.find((p) => p.id === pid)!.answers, already_receiving: [] };
    for (const k of ['annual_family_income', 'monthly_income']) if (typeof a[k] === 'number') a[k] = bucketFor(k, a[k] as number);
    await addFamily(a, members);
  }
}

export const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
