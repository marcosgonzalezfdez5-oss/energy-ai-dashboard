# energy-ai-dashboard

A role-based (RBAC) solar energy monitoring dashboard with an embedded AI chat assistant
("InvertixAI"). Operators and admins can browse plant performance (energy, irradiance, power,
temperature), and admins additionally see financial data (market prices, monthly costs, revenue).
The chat assistant can answer questions about that data and — the newest capability — create
persistent, personal chart/KPI widgets directly on the user's dashboard.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack) + Tailwind CSS + Recharts
- **Agent**: [`eve`](https://github.com/vercel/eve) (Vercel's durable agent framework) running GPT-4o, embedded in the chat page via `eve/react`
- **Database/Auth**: Supabase (Postgres + Auth), Row Level Security as the primary authorization boundary
- **Language**: TypeScript throughout (frontend, API routes, and agent tools)

## Project structure

```text
energy-ai-dashboard/
├── docs/                        # Feature docs (see below)
├── supabase/                    # Hand-written SQL, pasted into the Supabase SQL editor —
│   │                            # NOT an auto-applied migrations folder
│   ├── rls.sql                  #   Row Level Security policies for the core business tables
│   ├── rpc.sql                  #   SECURITY DEFINER RPC functions used by API routes + agent tools
│   ├── chat.sql                 #   chat_threads / chat_events (chat history persistence)
│   └── widgets.sql              #   widgets table (AI-created dashboard widgets)
│
└── src/frontend/                # The Next.js app (single deployable unit)
    ├── app/                     # App Router pages + API routes
    │   ├── dashboard/           #   Per-plant view + "My Widgets" (AI-created widgets)
    │   ├── overview/            #   Cross-plant comparison view
    │   ├── daily/               #   Per-day drill-down view
    │   ├── chat/                #   The InvertixAI chat page
    │   └── api/                 #   REST-ish routes the frontend calls (plants, readings,
    │                             #   daily-energy, market-prices, monthly-costs, …), each
    │                             #   wrapped in withAuth/withAdminAuth from lib/api-handler.ts
    │
    ├── agent/                   # The eve agent — see docs/presentation.md for why eve
    │   ├── agent.ts             #   Model config (GPT-4o)
    │   ├── instructions.md      #   System prompt: capabilities, role-based access, behavior
    │   ├── channels/eve.ts      #   HTTP channel + auth (Supabase OIDC)
    │   └── tools/               #   One file per tool, auto-discovered — no registration step.
    │                             #   Read-only: get_plants, get_datasources, get_readings,
    │                             #   get_daily_energy, get_market_prices, get_monthly_costs,
    │                             #   compare_plants, get_data_range.
    │                             #   Writes (dashboard widgets): create_widget, update_widget,
    │                             #   list_my_widgets, delete_widget.
    │
    ├── components/
    │   ├── widgets/              # Renderers for AI-created widgets (KpiCard, LineChartWidget,
    │   │                         # ComparisonChartWidget, registry, error boundary, section container)
    │   ├── ui/                   # Small hand-rolled primitives (IconButton, Tooltip, Toast, ThemeToggle)
    │   ├── ChatPage.tsx           # Chat UI (message stream, tool-call cards, widget confirmation cards)
    │   ├── DashboardClient.tsx, PlantPanel.tsx, OverviewPanel.tsx, DailyDetailPanel.tsx, …
    │   └── ReadingChart.tsx, ComparisonChart.tsx, FinancialPanel.tsx   # Recharts-based visualizations
    │
    └── lib/                      # Shared code, split by trust boundary:
        ├── api.ts                 #   Typed client-side fetch wrappers for app/api/* routes
        ├── api-handler.ts         #   withAuth/withAdminAuth — server-side auth + profile resolution
        ├── auth-server.ts, supabase-server.ts   # Service-role client, per-user JWT minting for agent tools
        ├── supabase.ts            #   Anon-key browser client (RLS-enforced)
        ├── chat-history.ts, widgets.ts   # Direct browser reads/writes to user-owned tables (RLS-protected)
        ├── widget-config.ts       #   Widget config schema (shared by tools + renderers)
        ├── widget-data-check.ts, market-zones.ts, datasource-lookup.ts, relative-range.ts   # Widget-tool helpers
        └── movingAverage.ts, date-range.ts, timeRange.ts   # Small pure-data utilities
```

## Key architectural facts worth knowing before touching this repo

- **`supabase/*.sql` files are not migrations.** There's no migration tool wired up — each file is
  meant to be pasted into the Supabase SQL editor once. If you add a table, add a new `.sql` file
  and say so in your PR/commit; don't assume it ran automatically.
- **Two different write patterns exist on purpose.** Most tables are read through `app/api/*`
  routes (service-scoped, company-wide RLS). A few user-owned tables (`chat_threads`/`chat_events`,
  `widgets`) are written directly from the browser via the anon-key client — RLS
  (`user_id = auth.uid()`) is the only thing protecting those, by design (see `supabase/chat.sql`'s
  and `supabase/widgets.sql`'s comments).
- **`datasources` has no registered foreign key to `elements`** in this schema. PostgREST's
  `elements!inner(...)` embed syntax will fail with `PGRST200` — resolve `plant → elements →
  datasources` as two separate queries instead (see `lib/datasource-lookup.ts`).
- **Editing anything under `agent/`** invalidates eve's dev-time compiled snapshot for any
  in-flight chat session. After changing agent code, restart the dev server and start a **new**
  chat thread rather than resuming an old one.

## Docs

- [`docs/dashboard-widgets.md`](docs/dashboard-widgets.md) — how the AI-widget-creation feature
  works end to end: schema, agent tools, rendering, chat integration, known quirks.
- [`docs/presentation.md`](docs/presentation.md) — why this project is built on `eve` rather than
  a LangGraph/`deepagents`-style stack, and what that buys this specific app.

## Getting started

```bash
cd src/frontend
npm install
npm run dev
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. Run the SQL files under `supabase/` once
in the Supabase SQL editor before first use.
