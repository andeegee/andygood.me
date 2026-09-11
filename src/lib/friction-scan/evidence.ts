/** Canonicalise typography for comparison only. Never use this to rewrite displayed evidence. */
export function normaliseEvidence(text: string): string {
  return text.normalize("NFC")
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2010\u2011\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}
// Deliberately no case folding, punctuation deletion, word changes, NFKC,
// mathematical-minus/prime substitution or fuzzy/semantic matching.
