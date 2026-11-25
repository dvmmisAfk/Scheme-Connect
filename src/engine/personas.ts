import type { Answers } from './types';

/** Appendix B test personas. Also used by Presenter mode ("Load persona") and the Engine Lab. Unknown = omitted. */
export interface Persona {
  id: string;
  label: { en: string; hi: string };
  answers: Answers;
  eligible: string[];
  possibly: { id: string; missing: string[] }[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'P1', label: { en: 'Small farmer, 45', hi: 'छोटे किसान, 45' },
    answers: { state: 'MP', age: 45, gender: 'male', area: 'rural', marital: 'married', occupation: 'farmer', owns_cultivable_land: true, income_tax_payer: false, has_bank_account: true, annual_family_income: 80000, monthly_income: 8000, epfo_esic_nps_member: false, bpl: true, has_lpg_connection: true, secc_listed: false, ration_card: 'PHH', has_girl_child_under_10: false, house_type: 'kutcha', caste_category: 'OBC', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pm-kisan', 'pmjjby', 'pmsby', 'pm-jay', 'pmay-g'], possibly: [],
  },
  {
    id: 'P2', label: { en: 'Rural homemaker, 32', hi: 'गाँव की गृहिणी, 32' },
    answers: { state: 'MP', age: 32, gender: 'female', area: 'rural', marital: 'married', occupation: 'homemaker', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, annual_family_income: 120000, epfo_esic_nps_member: false, bpl: true, has_lpg_connection: false, secc_listed: false, ration_card: 'AAY', has_girl_child_under_10: true, house_type: 'pucca', caste_category: 'OBC', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pmjjby', 'pmsby', 'apy', 'pmuy', 'ssy', 'pm-jay', 'ladli-behna'], possibly: [],
  },
  {
    id: 'P3', label: { en: 'Elderly widower, 72', hi: 'बुज़ुर्ग विधुर, 72' },
    answers: { state: 'MP', age: 72, gender: 'male', area: 'rural', marital: 'widowed', occupation: 'retired', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, annual_family_income: 40000, bpl: true, has_lpg_connection: true, secc_listed: false, ration_card: 'PHH', has_girl_child_under_10: false, house_type: 'pucca', caste_category: 'General', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['ignoaps', 'pm-jay'], possibly: [],
  },
  {
    id: 'P4', label: { en: 'Urban street vendor, 28', hi: 'शहर के रेहड़ी वाले, 28' },
    answers: { state: 'MP', age: 28, gender: 'male', area: 'urban', marital: 'unmarried', occupation: 'street_vendor', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, annual_family_income: 150000, monthly_income: 12000, epfo_esic_nps_member: false, bpl: false, has_lpg_connection: true, secc_listed: false, ration_card: 'none', has_girl_child_under_10: false, caste_category: 'OBC', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pmjjby', 'pmsby', 'apy', 'pm-sym'], possibly: [],
  },
  {
    id: 'P5', label: { en: 'SC college student, 19', hi: 'SC कॉलेज विद्यार्थी, 19' },
    answers: { state: 'MP', age: 19, gender: 'male', area: 'urban', marital: 'unmarried', occupation: 'student', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, annual_family_income: 180000, epfo_esic_nps_member: false, bpl: false, has_lpg_connection: true, secc_listed: false, ration_card: 'none', has_girl_child_under_10: false, caste_category: 'SC', enrolled_post_matric: true, admitted_higher_education: true, class12_board: 'MP', class12_percent: 78 },
    eligible: ['pmjjby', 'pmsby', 'apy', 'post-matric-sc', 'mmvy'], possibly: [],
  },
  {
    id: 'P6', label: { en: 'Government employee, 35', hi: 'सरकारी कर्मचारी, 35' },
    answers: { state: 'MP', age: 35, gender: 'male', area: 'urban', marital: 'married', occupation: 'govt_employee', owns_cultivable_land: false, income_tax_payer: true, has_bank_account: true, annual_family_income: 900000, monthly_income: 60000, epfo_esic_nps_member: true, bpl: false, has_lpg_connection: true, secc_listed: false, ration_card: 'none', has_girl_child_under_10: false, caste_category: 'General', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pmjjby', 'pmsby'], possibly: [],
  },
  {
    id: 'P7', label: { en: 'Carpenter, 38', hi: 'बढ़ई, 38' },
    answers: { state: 'MP', age: 38, gender: 'male', area: 'urban', marital: 'married', occupation: 'artisan', vishwakarma_trade: 'carpenter', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, annual_family_income: 160000, monthly_income: 11000, epfo_esic_nps_member: false, bpl: false, has_lpg_connection: true, secc_listed: false, ration_card: 'none', has_girl_child_under_10: false, caste_category: 'OBC', enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pmjjby', 'pmsby', 'apy', 'pm-sym', 'pm-vishwakarma'], possibly: [],
  },
  {
    id: 'P8', label: { en: 'Woman, 40, incomplete profile', hi: 'महिला, 40, अधूरी जानकारी' },
    answers: { state: 'MP', age: 40, gender: 'female', area: 'urban', marital: 'married', occupation: 'homemaker', owns_cultivable_land: false, income_tax_payer: false, has_bank_account: true, secc_listed: false, ration_card: 'none', has_girl_child_under_10: false, enrolled_post_matric: false, admitted_higher_education: false },
    eligible: ['pmjjby', 'pmsby', 'apy'],
    possibly: [
      { id: 'pmuy', missing: ['bpl', 'has_lpg_connection'] },
      { id: 'ladli-behna', missing: ['annual_family_income'] },
    ],
  },
];

export type ExpectedStatus = 'eligible' | 'possibly' | 'not';

export function expectedStatus(p: Persona, schemeId: string): ExpectedStatus {
  if (p.eligible.includes(schemeId)) return 'eligible';
  if (p.possibly.some((x) => x.id === schemeId)) return 'possibly';
  return 'not';
}
