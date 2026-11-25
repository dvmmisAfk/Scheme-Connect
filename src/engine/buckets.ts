/**
 * Income questions are asked as buckets. Each bucket stores a representative value that sits
 * inside it, so rule thresholds (₹2.5 lakh, ₹6 lakh, ₹15,000/month) never fall inside a bucket's stored value range wrongly.
 */
export const BUCKETS: Record<string, { upTo: number; value: number }[]> = {
  annual_family_income: [
    { upTo: 100000, value: 80000 },
    { upTo: 250000, value: 200000 },
    { upTo: 600000, value: 400000 },
    { upTo: Infinity, value: 800000 },
  ],
  monthly_income: [
    { upTo: 10000, value: 8000 },
    { upTo: 15000, value: 13000 },
    { upTo: Infinity, value: 20000 },
  ],
};

/** Exact amount -> the stored value of the bucket a person would tick. */
export function bucketFor(attr: string, amount: number): number {
  const b = BUCKETS[attr];
  if (!b) return amount;
  return b.find((x) => amount <= x.upTo)!.value;
}
