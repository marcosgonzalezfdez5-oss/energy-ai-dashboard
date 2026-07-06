import { Client } from "eve/client";
import { supabase } from "@/lib/supabase";

/** Eve client configured with the current user's Supabase session token.
 *  Shared by useEveAgent (interactive turns) and the thread catch-up logic
 *  in ChatPage (replaying/reconnecting to an existing session). */
export function createEveClient() {
  return new Client({
    host: "",
    auth: {
      bearer: async () => (await supabase.auth.getSession()).data.session?.access_token ?? "",
    },
  });
}
