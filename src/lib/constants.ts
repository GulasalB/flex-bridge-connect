export const GOALS = [
  "US college applications",
  "Career advice",
  "Transition support",
  "Scholarships",
  "Grad school",
  "Community leadership",
] as const;

export function matchScore(mine: string[], theirs: string[]): number {
  if (!mine.length || !theirs.length) return 55;
  const shared = mine.filter((g) => theirs.includes(g)).length;
  return Math.min(98, 55 + Math.round((shared / mine.length) * 43));
}

export function formatDate(value: string): string {
  return new Date(value)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" })
    .toUpperCase()
    .replace(",", " ·");
}
