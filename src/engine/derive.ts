import type { Answers, Profile } from './types';

const UNORGANISED = new Set(['farmer', 'street_vendor', 'artisan', 'daily_wage']);
const ORGANISED = new Set(['govt_employee', 'private_salaried', 'student', 'homemaker', 'retired']);

/** Attributes derive() owns, mapped to the question that decides them. */
export const DERIVED_FROM: Record<string, string> = {
  govt_employee: 'occupation',
  unorganised_worker: 'occupation',
  vishwakarma_trade: 'occupation',
};

/**
 * Turn raw answers into an evaluable profile:
 *  - "don't know" (null) becomes absent (unknown);
 *  - govt_employee, unorganised_worker and vishwakarma_trade are filled from occupation.
 * If occupation is unknown, the derived attributes are unknown too.
 */
export function derive(answers: Answers): Profile {
  const p: Profile = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v !== null && v !== undefined) p[k] = v;
  }
  delete p.govt_employee;
  delete p.unorganised_worker;
  delete p.vishwakarma_trade;

  const occ = p.occupation;
  if (typeof occ !== 'string') return p;

  p.govt_employee = occ === 'govt_employee';

  if (UNORGANISED.has(occ)) p.unorganised_worker = true;
  else if (ORGANISED.has(occ)) p.unorganised_worker = false;
  else {
    // "other": asked as its own question.
    const u = answers.unorganised_worker;
    if (typeof u === 'boolean') p.unorganised_worker = u;
  }

  if (occ === 'artisan') {
    const tr = answers.vishwakarma_trade;
    if (typeof tr === 'string') p.vishwakarma_trade = tr;
  } else {
    p.vishwakarma_trade = 'none';
  }
  return p;
}
