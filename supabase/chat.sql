-- Chat history persistence for the InvertixAI agent (src/frontend/components/ChatPage.tsx).
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Unlike every other table in this project, chat_threads/chat_events are
-- user-writable directly from the browser (the anon-key client in
-- lib/supabase.ts) — there is no service-role API route in front of them.
-- RLS is therefore the only thing enforcing per-user isolation here, scoped
-- by auth.uid() directly (mirrors the profiles_select_own pattern in
-- rls.sql), not by company like plants/readings/etc.
--
-- chat_events.event stores the raw eve HandleMessageStreamEvent verbatim, so
-- it can be fed straight back into useEveAgent's `initialEvents` on reopen.

CREATE TABLE IF NOT EXISTS chat_threads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                  text NOT NULL DEFAULT 'New conversation',
  eve_session_id         text,
  eve_continuation_token text,
  eve_stream_index       integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id  uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  seq        integer NOT NULL,
  event      jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, seq)
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_events  ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_threads TO authenticated;
GRANT SELECT, INSERT                ON chat_events  TO authenticated;

DROP POLICY IF EXISTS chat_threads_owner ON chat_threads;
CREATE POLICY chat_threads_owner ON chat_threads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS chat_events_owner ON chat_events;
CREATE POLICY chat_events_owner ON chat_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_threads t WHERE t.id = chat_events.thread_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_threads t WHERE t.id = chat_events.thread_id AND t.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Rollback:
--
-- DROP TABLE IF EXISTS chat_events;
-- DROP TABLE IF EXISTS chat_threads;
-- ---------------------------------------------------------------------------
