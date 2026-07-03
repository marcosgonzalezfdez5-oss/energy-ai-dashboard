export type Range = "24h" | "7d" | "30d";

export function toStartEnd(range: Range): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  if (range === "24h") start.setHours(start.getHours() - 24);
  else if (range === "7d") start.setDate(start.getDate() - 7);
  else start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
