import { SCHEME_BY_ID } from '@/data';
import { PERSONAS } from './personas';
import { screenOne } from './screen';
import type { Answers } from './types';

const base = (id: string) => PERSONAS.find((p) => p.id === id)!.answers;
const status = (schemeId: string, a: Answers) => screenOne(SCHEME_BY_ID[schemeId]!, a).status;

describe('boundary tests', () => {
  it('APY: age 40 eligible, 41 not', () => {
    expect(status('apy', { ...base('P4'), age: 40 })).toBe('eligible');
    expect(status('apy', { ...base('P4'), age: 41 })).toBe('not');
  });

  it('PMSBY: age 70 eligible, 71 not', () => {
    expect(status('pmsby', { ...base('P3'), age: 70 })).toBe('eligible');
    expect(status('pmsby', { ...base('P3'), age: 71 })).toBe('not');
  });

  it('Ladli Behna: family income ₹2,50,000 eligible, ₹2,50,001 not', () => {
    expect(status('ladli-behna', { ...base('P2'), annual_family_income: 250000 })).toBe('eligible');
    expect(status('ladli-behna', { ...base('P2'), annual_family_income: 250001 })).toBe('not');
  });

  it('MMVY MP Board: 70% eligible, 69.9% not', () => {
    expect(status('mmvy', { ...base('P5'), class12_board: 'MP', class12_percent: 70 })).toBe('eligible');
    expect(status('mmvy', { ...base('P5'), class12_board: 'MP', class12_percent: 69.9 })).toBe('not');
  });

  it('MMVY CBSE: 85% eligible, 84.9% not', () => {
    expect(status('mmvy', { ...base('P5'), class12_board: 'CBSE', class12_percent: 85 })).toBe('eligible');
    expect(status('mmvy', { ...base('P5'), class12_board: 'CBSE', class12_percent: 84.9 })).toBe('not');
  });

  it('PM-SYM: monthly income ₹15,000 eligible, ₹15,001 not', () => {
    expect(status('pm-sym', { ...base('P4'), monthly_income: 15000 })).toBe('eligible');
    expect(status('pm-sym', { ...base('P4'), monthly_income: 15001 })).toBe('not');
  });
});
