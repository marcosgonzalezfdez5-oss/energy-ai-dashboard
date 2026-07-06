-- Persistent AI-created dashboard widgets (src/frontend/components/widgets/).
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Like chat_threads/chat_events (see chat.sql), this table is written
-- directly from the browser (the anon-key client in lib/supabase.ts) for
-- rename/soft-delete/reorder, and via the Eve agent's user-scoped client
-- (lib/supabase-server.ts's getUserScopedSupabase) for create/update. RLS is
-- the only thing enforcing per-user isolation, scoped by auth.uid() directly
-- — not by company. Widgets are private to the user who created them.
--
-- config is validated at the application layer (zod, in
-- src/frontend/lib/widget-config.ts) against a discriminated union keyed by
-- widget_type, not by any DB-level CHECK constraint — the frontend must
-- still treat an existing row's config as untrusted at render time (it's
-- browser-writable, like the rest of this table).
--
-- No DELETE grant: every widget removal in this feature is a soft delete
-- (UPDATE deleted_at), never a hard DELETE, so the privilege is not handed
-- out at all.

CREATE TABLE IF NOT EXISTS widgets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type  text NOT NULL CHECK (widget_type IN ('kpi', 'line_chart', 'comparison_chart')),
  title        text NOT NULL,
  config       jsonb NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_widgets_user_active
  ON widgets (user_id, sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON widgets TO authenticated;

DROP POLICY IF EXISTS widgets_owner ON widgets;
CREATE POLICY widgets_owner ON widgets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Rollback:
--
-- DROP TABLE IF EXISTS widgets;
-- ---------------------------------------------------------------------------
