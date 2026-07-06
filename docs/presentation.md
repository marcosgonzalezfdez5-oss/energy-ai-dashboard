# Why This Agent Is Built on `eve`

This project's chat assistant ("InvertixAI") is built on [`eve`](https://github.com/vercel/eve), Vercel's
agent framework, rather than a hand-rolled LangGraph stack or LangChain's `deepagents` harness. This
doc explains what that choice buys this specific app, using the AI-widget-creation feature
(`docs/dashboard-widgets.md`) as the concrete evidence, then compares `eve` against `deepagents`
directly and honestly — including where `deepagents` would actually be the better choice.

## The design, in one sentence

A user's chat message becomes a durable, resumable session; a tool call becomes a validated,
type-checked write against a Postgres table with a hard authorization boundary (RLS); and the
dashboard becomes a live view of that table. Nothing about that pipeline was hand-built —
`eve` supplied the session/tool machinery, and this app supplied ~10 tool files and a schema.

## What `eve` actually gave this project

These aren't abstract framework claims — each one maps to something this codebase visibly
depends on, verified directly from `eve`'s bundled docs (`node_modules/eve/docs/`) and this
session's implementation work.

### 1. Durable sessions, for free

Every chat turn in `eve` runs as a durable workflow (built on the open-source
[Workflow SDK](https://workflow-sdk.dev/)) that checkpoints at each step. A crash, a serverless
timeout, or a redeploy mid-turn resumes from the last completed step — "there's nothing to
configure," per `eve`'s own docs.

This is why `ChatPage.tsx`'s `AgentChatPane` can be as simple as it is: it mirrors stream events
into `chat_threads`/`chat_events` purely so the **browser** can rehydrate a transcript on reload,
and replays from a `continuationToken` if a turn was still running when the tab closed. The hard
part — the session surviving a server restart at all — is `eve`'s job, not this app's.

### 2. A real trust boundary, not a convention

`eve` splits execution into two hard-isolated contexts:

| | App runtime | Sandbox |
|---|---|---|
| Secrets / `process.env` | Yes | No |
| Your tool code | Yes | No |
| Filesystem | App's own | Isolated `/workspace` (microVM on Vercel) |

Every tool this project defines (`create_widget`, `get_daily_energy`, etc.) runs in the trusted
app runtime, where `getUserScopedSupabase(userId)` mints a short-lived, RLS-scoped Postgres JWT.
The model never sees a credential — only tool inputs and outputs. This project doesn't use the
sandbox (no shell/file-execution tools), but the separation is architectural, not a rule the team
has to remember to follow.

### 3. Filesystem-first authoring — the structure *is* the contract

An `eve` agent is a directory, not a config object: `instructions.md` for the system prompt,
`tools/*.ts` for typed integrations, `channels/*.ts` for transport. Adding `create_widget` was
"drop a file in `agent/tools/`" — no registration list, no wiring. This is a real, observed
property of this codebase, not a claim from the docs: every tool added this session (`create_widget`,
`update_widget`, `list_my_widgets`, `delete_widget`, `get_data_range`) was auto-discovered the
moment the file existed.

### 4. Type-safe tools, converted to the model's function-calling schema automatically

Tools are `zod` schemas + an `execute` function; `eve` converts them to the JSON Schema the model
provider needs. (This project hit a real edge of that conversion — a `z.discriminatedUnion` at a
tool's schema root doesn't serialize with a top-level `type: "object"`, which OpenAI's function
API rejects — and fixed it by flattening to plain optional fields, the same shape the framework's
own default-harness tools use. Documented in `docs/dashboard-widgets.md`.)

### 5. Multi-tenant dynamic capabilities

`eve` can resolve tools, skills, and instructions per-caller at `session.started`/`turn.started`
via `defineDynamic`. This app doesn't need per-tenant tool sets today (one InvertixAI instance,
role gated by `profile.role`/`access_scope`), but the primitive exists natively rather than
requiring a bespoke resolver layer if the product grows into true multi-tenancy.

### 6. It deploys as *part of* this Next.js app, not next to it

`eve`'s runtime (Nitro + Workflow) is designed to run inside the same Vercel deployment as the
Next.js frontend — one deployable unit, one set of environment variables, one place to look at
logs. For a project whose entire frontend is already a Next.js app on Vercel, that's one fewer
system to provision and operate.

## `eve` vs. LangChain's `deepagents`

`deepagents` ([Python](https://github.com/langchain-ai/deepagents) /
[JS](https://github.com/langchain-ai/deepagentsjs)) is LangChain's "batteries-included agent
harness" — it replicates the architecture of Claude Code (planning tool, subagents, virtual
filesystem) on top of the LangGraph runtime. It's a strong, well-designed framework — just aimed
at a different shape of problem than this app has.

| | `eve` | `deepagents` |
|---|---|---|
| **Core unit of work** | A durable session (survives crashes/redeploys natively via Workflow SDK) | A LangGraph run (durability/streaming/persistence come from the LangGraph runtime underneath) |
| **Agent definition** | A directory (`instructions.md`, `tools/`, `channels/`, …) — markdown + typed TS files | `createDeepAgent({ model, tools, systemPrompt })` — a compiled LangGraph graph |
| **Isolation model** | Hard split: trusted app runtime (secrets, your code) vs. isolated microVM sandbox for shell/file tools | Virtual filesystem with pluggable backends (in-memory, disk, LangGraph store) and glob-based permission rules — no equivalent hardware-isolated execution sandbox as a default |
| **Planning** | None built in — the model just calls tools | Built-in `write_todos` tool for explicit task-list tracking across long multi-step work |
| **Delegation** | Subagents get their own durable session, sandbox, skills, and state — a hard boundary | `task` tool spawns ephemeral subagents with fresh/isolated context, returning a compressed report to the parent |
| **Context management** | Not a first-class concern (turns are short, tool-call based) | Middleware for conversation compression, tool-result offloading, prompt caching hints — built for long-running context-heavy work |
| **Transport** | Built-in channel abstraction: HTTP, Slack, Telegram, Twilio, GitHub, each with signature-verification requirements baked into the framework's guidance | Bring your own transport; the package is the agent loop, not the channel layer |
| **Deployment** | Native to Vercel (Nitro + Vercel Workflow), also self-hostable | LangGraph Platform or self-hosted LangGraph server |
| **Language** | TypeScript-first | Python-first, with a JS/TS port (`deepagentsjs`) |

### Why this matters for *this* app specifically

This project's agent is a short-turn, tool-calling product assistant: "what's today's output,"
"create a widget," "compare these two plants." It doesn't run multi-hour research tasks, doesn't
need to plan across dozens of steps, and doesn't spawn child agents to parallelize work — so
`deepagents`' headline features (`write_todos` planning, `task`-tool subagent delegation, a virtual
filesystem for skills/memory) would mostly sit unused. What this app *does* need — a session that
survives a serverless redeploy, a hard boundary between "code with secrets" and "code the model
can trigger," and zero-ceremony tool authoring for a project that's already a Next.js app on
Vercel — is exactly what `eve`'s primitives are built around.

### Where `deepagents` would be the right call instead

Be honest about the other side: a long-horizon, file/code-heavy autonomous agent — something
doing multi-file refactors, deep research with dozens of search-and-synthesize steps, or anything
that benefits from an explicit visible plan and delegating sub-tasks to isolated child agents —
is precisely what `deepagents` was built for, and its middleware for context compression and
prompt caching solves a real problem (context window exhaustion on long tasks) that this app's
short chat turns never encounter. If this product ever grows a "deep research" or "autonomous
multi-step operations" mode, that's the point where reaching for `deepagents`' planning/subagent
machinery — or `eve`'s own [subagents](https://eve.dev/docs/subagents) primitive, which offers a
comparable isolation boundary — would start paying for itself.

## Sources

- [`eve` README](https://github.com/vercel/eve#readme) and bundled docs (`node_modules/eve/docs/`):
  [Execution Model and Durability](https://eve.dev/docs/concepts/execution-model-and-durability),
  [Security Model](https://eve.dev/docs/concepts/security-model),
  [Dynamic Capabilities](https://eve.dev/docs/guides/dynamic-capabilities)
- [Deep Agents overview — Docs by LangChain](https://docs.langchain.com/oss/python/deepagents/overview)
- [deepagents (Python) — GitHub](https://github.com/langchain-ai/deepagents)
- [deepagentsjs — GitHub](https://github.com/langchain-ai/deepagentsjs)
- [LangChain Deep Agents product page](https://www.langchain.com/deep-agents)
