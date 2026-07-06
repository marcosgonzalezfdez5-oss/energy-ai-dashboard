/**
 * The RPC functions in supabase/rpc.sql use an exclusive upper bound
 * (`ts < p_end`), but tool callers (the model) think in inclusive calendar
 * ranges — "the month of March" means end=2024-03-31, not 2024-04-01.
 * Converts an inclusive end date/datetime to the exclusive instant the RPCs
 * expect: the start (UTC midnight) of the day *after* end's calendar date.
 */
export function toExclusiveEnd(end: string): string {
  const d = new Date(end);
  const exclusive = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return exclusive.toISOString();
}
