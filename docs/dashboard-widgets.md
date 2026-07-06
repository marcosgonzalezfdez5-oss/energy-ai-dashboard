# AI-Created Dashboard Widgets

Users can ask the chat assistant to create charts and KPIs, and they appear as persistent,
personal widgets on the dashboard — surviving logout/login, renameable, and deletable.

## Example

> "Create a widget showing today's total energy production for Solar Farm Alpha"
>
> "Create a chart comparing daily power output between plant C1-001 and C1-002"

The assistant resolves the plant/metric names, picks a date range with actual data in it, creates
the widget, and confirms in chat. The widget shows up immediately in the **My Widgets** section at
the top of `/dashboard`, above the existing per-plant panel — independent of which plant is
selected in the sidebar.

## User-facing behavior

- **Creation is immediate** — no preview/approval step. The assistant creates the widget, confirms
  what it made in chat, and offers an inline **Undo** button on that confirmation.
- **Rename**: hover a widget → pencil icon → inline edit.
- **Delete**: hover a widget → trash icon → it disappears immediately with an "Undo" toast
  (soft delete — undo just un-deletes the row, no confirmation dialog needed since it's reversible).
- **Reorder**: hover a widget → up/down chevrons.
- **Edit via chat** — "change that to last 7 days", "compare that across all plants instead" — the
  assistant finds the widget (asking you to disambiguate if more than one could match) and updates
  it in place rather than creating a duplicate.
- **Private per user** — each user has their own dashboard and widgets; nothing is shared across
  the company.
- **Always-fresh data** — widgets store only their configuration (which plant/metric/range), never
  a data snapshot. Every dashboard load re-fetches through the same API routes the rest of the app
  uses, so a widget never shows stale numbers.

## Supported widget types (v1)

| Type | Description | Reuses |
|---|---|---|
| `kpi` | Single number over a range (e.g. total energy today) | new `KpiCard` component |
| `line_chart` | Time series for one plant/datasource | existing `ReadingChart` |
| `comparison_chart` | Multi-plant/series comparison | existing `ComparisonChart` |

Bar charts, pie charts, tables, heatmaps, forecasts, alerts, and markdown widgets are not
supported — the assistant is instructed to say so plainly rather than substitute a different type.

## How it works

### Data model

A single `widgets` table (`supabase/widgets.sql`), private per user via RLS
(`user_id = auth.uid()`) — the same pattern as the existing `chat_threads`/`chat_events` tables.
Each row stores a `widget_type`, a `title`, a `config` JSON blob (plant/datasource ids, metric,
aggregation, date range), and a `sort_order`. Soft-deleted via `deleted_at`; never hard-deleted.

The `config` shape is a discriminated union defined in `lib/widget-config.ts` and re-validated at
render time — the table is browser-writable, so nothing about its contents is trusted blindly.

### Agent tools

Four new tools under `agent/tools/`, alongside the existing read-only tools:

- `create_widget` — creates a widget after validating the plant/datasource belongs to the caller's
  company and confirming the chosen date range actually contains data.
- `update_widget` — modifies an existing widget in place (range, plant/datasource, chart type).
- `list_my_widgets` — lists the user's widgets so the assistant can find the right one to edit.
- `delete_widget` — soft-deletes a widget (chat-driven parity with the dashboard's trash icon).
- `get_data_range` — reports the earliest/latest dates with actual readings, so the assistant can
  pick a date range that isn't empty (important for historical/demo datasets that don't extend to
  the present day).

All writes go through the same `getUserScopedSupabase(userId)` pattern the read-only tools already
use, so Postgres RLS enforces per-user/per-company scoping — the agent can never write a widget
referencing another company's plant.

**Data-existence guard**: `create_widget`/`update_widget` refuse to save a widget whose resolved
date range contains zero readings. The rejection tells the assistant the actual available data
span, so it can pick a valid range or ask the user, instead of silently creating an empty chart.

### Rendering

`components/widgets/MyWidgetsSection.tsx` fetches the user's widgets (on mount, and on window
focus) and renders each one through a small registry (`components/widgets/registry.tsx`) that maps
`widget_type` → `KpiCard` / `LineChartWidget` / `ComparisonChartWidget`. Each widget is wrapped in
its own error boundary, so a widget referencing a since-deleted plant can't take down the section.

### Chat integration

`create_widget`/`update_widget`/`delete_widget` results get a rich confirmation card in the chat
UI (instead of the generic collapsible JSON tool card) with an inline **Undo** button that calls
the same rename/soft-delete/restore functions the dashboard UI uses — no extra agent round-trip
needed to undo.

## Setup

Run `supabase/widgets.sql` once in the Supabase SQL editor (Dashboard → SQL Editor → New query) —
like the other `.sql` files in this repo, it is not auto-applied by any migration tooling.

## Known quirks / troubleshooting

- **`datasources` has no registered foreign key to `elements`** in this schema, so PostgREST's
  `elements!inner(...)` embed syntax fails with `PGRST200`. All datasource lookups (existing API
  routes and the new agent tools) resolve `plant → elements → datasources` as two separate
  queries instead — see `lib/datasource-lookup.ts`.
- **eve dev-runtime snapshots**: editing anything under `agent/` invalidates the compiled agent
  snapshot a resumed chat session is pinned to. If you see `ENOENT ... compiled-agent-manifest.json`
  after changing an agent file, restart the dev server and start a **new** chat thread — resuming
  the old thread will keep failing since it's pinned to a now-deleted snapshot.
