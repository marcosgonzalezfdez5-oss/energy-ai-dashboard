import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import { getCompanyDataSpan } from "../../lib/widget-data-check";

// Lets the agent discover the earliest/latest dates for which readings exist
// BEFORE choosing a widget's date range — otherwise it has no way to know
// whether "today" or "last 7 days" actually contains data (a static or
// historical dataset may end well before the current date).
export default defineTool({
  description:
    "Get the earliest and latest dates for which the user's plants have any readings. " +
    "Call this before creating a widget (or any dated query) when you're unsure what date range " +
    "contains data — a widget over a range with no readings will be rejected.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const span = await getCompanyDataSpan(supabase, profile.company_id);
    return {
      earliest_date: span.min ? span.min.slice(0, 10) : null,
      latest_date: span.max ? span.max.slice(0, 10) : null,
    };
  },
});
