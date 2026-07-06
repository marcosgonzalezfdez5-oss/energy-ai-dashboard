import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { supabase } from "@/lib/supabase";

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  eve_session_id: string | null;
  eve_continuation_token: string | null;
  eve_stream_index: number;
  created_at: string;
  updated_at: string;
}

const TERMINAL_EVENT_TYPES = new Set([
  "turn.completed",
  "turn.failed",
  "session.waiting",
  "session.completed",
  "session.failed",
]);

export function isTerminalEvent(event: HandleMessageStreamEvent): boolean {
  return TERMINAL_EVENT_TYPES.has(event.type);
}

export function threadSessionState(thread: ChatThread): SessionState | undefined {
  if (!thread.eve_session_id) return undefined;
  return {
    sessionId: thread.eve_session_id,
    continuationToken: thread.eve_continuation_token ?? undefined,
    streamIndex: thread.eve_stream_index,
  };
}

export async function listThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createThread(): Promise<ChatThread> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function renameThread(threadId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("chat_threads")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", threadId);
  if (error) throw error;
}

export async function deleteThread(threadId: string): Promise<void> {
  const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
  if (error) throw error;
}

export async function checkpointThread(threadId: string, session: SessionState): Promise<void> {
  const { error } = await supabase
    .from("chat_threads")
    .update({
      eve_session_id: session.sessionId ?? null,
      eve_continuation_token: session.continuationToken ?? null,
      eve_stream_index: session.streamIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  if (error) throw error;
}

export async function fetchThreadEvents(threadId: string): Promise<HandleMessageStreamEvent[]> {
  const { data, error } = await supabase
    .from("chat_events")
    .select("event")
    .eq("thread_id", threadId)
    .order("seq", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.event as HandleMessageStreamEvent);
}

/** Best-effort mirror write — a dropped write here is self-healed the next
 *  time the thread is opened, via the catch-up stream replay in ChatPage. */
export async function appendEvent(
  threadId: string,
  seq: number,
  event: HandleMessageStreamEvent
): Promise<void> {
  const { error } = await supabase
    .from("chat_events")
    .upsert({ thread_id: threadId, seq, event }, { onConflict: "thread_id,seq" });
  if (error) console.error("Failed to mirror chat event", error);
}
