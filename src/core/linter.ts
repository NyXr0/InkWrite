export interface ClichéMatch {
  phrase: string;
  count: number;
  category: 'filler' | 'cliché' | 'weak-verb';
}

const WATCHLIST = [
  { phrase: 'suddenly', category: 'filler' as const },
  { phrase: 'just', category: 'filler' as const },
  { phrase: 'heart skipped a beat', category: 'cliché' as const },
  { phrase: 'looked', category: 'filler' as const },
  { phrase: 'very', category: 'filler' as const },
  { phrase: "breath she didn't know she was holding", category: 'cliché' as const },
  { phrase: 'started to', category: 'weak-verb' as const },
  { phrase: 'began to', category: 'weak-verb' as const },
  { phrase: 'almost', category: 'filler' as const },
  { phrase: 'seemed to', category: 'weak-verb' as const },
];

export function analyzeManuscriptClichés(text: string): ClichéMatch[] {
  const lower = text.toLowerCase();
  const results: ClichéMatch[] = [];

  for (const item of WATCHLIST) {
    const regex = new RegExp(`\\b${item.phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      results.push({
        phrase: item.phrase,
        count,
        category: item.category,
      });
    }
  }

  // Sort by count descending
  return results.sort((a, b) => b.count - a.count);
}
