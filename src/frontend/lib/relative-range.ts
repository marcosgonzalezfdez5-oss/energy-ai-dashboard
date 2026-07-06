import { RelativeRange } from "./widget-config";
import { toExclusiveEnd } from "./date-range";

// Resolves a widget's stored range (relative or absolute) into the ISO
// start/end instants lib/api.ts's getPlantDailyEnergy/getDailyReadings/
// getDatasourceDailyAvg/getReadings expect. Recomputed from `now` on every
// call (never cached) so "today" always means today — see widget-config.ts's
// decision that widgets store config, not data. Uses UTC calendar days and
// the same exclusive-upper-bound convention as lib/date-range.ts's
// toExclusiveEnd (the RPCs in supabase/rpc.sql all do `ts < p_end`).

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

export function resolveRelativeRange(range: RelativeRange, now: Date = new Date()): { start: string; end: string } {
  if (range.mode === "absolute") {
    return { start: `${range.start}T00:00:00Z`, end: toExclusiveEnd(range.end) };
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let startDay: Date;
  let endDay: Date; // inclusive

  switch (range.preset) {
    case "today":
      startDay = today;
      endDay = today;
      break;
    case "yesterday":
      startDay = addDaysUTC(today, -1);
      endDay = startDay;
      break;
    case "last_7_days":
      startDay = addDaysUTC(today, -6);
      endDay = today;
      break;
    case "last_30_days":
      startDay = addDaysUTC(today, -29);
      endDay = today;
      break;
    case "month_to_date":
      startDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      endDay = today;
      break;
    case "last_month": {
      const firstOfThisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      startDay = new Date(Date.UTC(firstOfThisMonth.getUTCFullYear(), firstOfThisMonth.getUTCMonth() - 1, 1));
      endDay = addDaysUTC(firstOfThisMonth, -1);
      break;
    }
  }

  return { start: `${isoDate(startDay)}T00:00:00Z`, end: toExclusiveEnd(isoDate(endDay)) };
}
