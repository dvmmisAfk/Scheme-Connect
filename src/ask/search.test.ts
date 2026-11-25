import { ask } from './search';

const top = (q: string, lang: 'en' | 'hi' = 'en') => ask(q, lang);

describe('Ask: answers only from the knowledge base', () => {
  it.each([
    ['What documents do I need for PM Kisan?', 'pm-kisan'],
    ['How much pension does Atal Pension Yojana give?', 'apy'],
    ['Ladli Behna documents', 'ladli-behna'],
    ['free LPG connection', 'pmuy'],
    ['hospital treatment cover Ayushman', 'pm-jay'],
  ])('%s -> %s', (q, id) => {
    const r = top(q);
    expect(r.found).toBe(true);
    expect(r.chunks[0]!.scheme_id).toBe(id);
  });

  it('answers in Hindi', () => {
    const r = top('लाड़ली बहना में कितने पैसे मिलते हैं', 'hi');
    expect(r.found).toBe(true);
    expect(r.chunks[0]!.scheme_id).toBe('ladli-behna');
  });

  it.each(['What is the weather in Bhopal?', 'Who won the cricket match?', 'How do I make a passport?'])('no answer: %s', (q) => {
    expect(top(q).found).toBe(false);
  });
});
