'use client'

import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useEveAgent } from "eve/react";
import type { EveDynamicToolPart, EveMessage, SessionState } from "eve/client";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Thread persistence (localStorage)
// ---------------------------------------------------------------------------

const THREADS_KEY = "invertix_threads";

interface StoredThread {
  id: string;
  title: string;
  eveSession: SessionState | null;
  created_at: string;
}

function loadThreads(): StoredThread[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(THREADS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveThreads(threads: StoredThread[]) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

/** Clears locally-persisted chat threads (titles, history, Eve session cursors).
 *  Call on sign-out so the next login on this browser doesn't see the
 *  previous user's conversations. */
export function clearStoredThreads() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(THREADS_KEY);
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1:         ({ children }) => <h1 className="text-base font-semibold text-t50 mt-3 mb-2 first:mt-0">{children}</h1>,
        h2:         ({ children }) => <h2 className="text-sm font-semibold text-t100 mt-2.5 mb-1.5 first:mt-0">{children}</h2>,
        h3:         ({ children }) => <h3 className="text-sm font-medium text-t200 mt-2 mb-1 first:mt-0">{children}</h3>,
        ul:         ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol:         ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>,
        li:         ({ children }) => <li className="text-t300">{children}</li>,
        code:       ({ children, className }) =>
                      className
                        ? <code className="block bg-page border border-th rounded-lg p-3 text-xs font-mono text-t300 overflow-x-auto my-2 whitespace-pre">{children}</code>
                        : <code className="bg-surface px-1 py-0.5 rounded text-xs font-mono text-amber-300">{children}</code>,
        pre:        ({ children }) => <>{children}</>,
        table:      ({ children }) => <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{children}</table></div>,
        th:         ({ children }) => <th className="border border-th-sub px-3 py-1.5 text-left font-semibold text-t200 bg-surface">{children}</th>,
        td:         ({ children }) => <td className="border border-th-sub px-3 py-1.5 text-t300">{children}</td>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-500 pl-3 italic text-t400 my-2">{children}</blockquote>,
        a:          ({ href, children }) => <a href={href} className="text-amber-400 underline hover:text-amber-300" target="_blank" rel="noopener noreferrer">{children}</a>,
        hr:         () => <hr className="border-th-sub my-3" />,
        strong:     ({ children }) => <strong className="font-semibold text-t100">{children}</strong>,
        em:         ({ children }) => <em className="italic text-t300">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// Tool call card
// ---------------------------------------------------------------------------

function ToolCard({ part, expanded, onToggle }: {
  part: EveDynamicToolPart;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isDone = part.state === "output-available" || part.state === "output-error" || part.state === "output-denied";
  const isStreaming = !isDone;

  return (
    <div className="border border-th rounded-lg overflow-hidden text-xs my-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2 bg-surface text-left hover:bg-surface-60 transition-colors"
      >
        {isStreaming
          ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          : part.state === "output-error"
            ? <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        }
        <span className="font-mono font-semibold text-t200 flex-1">
          {part.toolName.replace(/_/g, " ")}
        </span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-t500 transition-transform ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {expanded && (
        <div className="divide-y divide-th">
          {part.input != null && (
            <div className="px-3 py-2 bg-page-40">
              <p className="text-t600 mb-1 uppercase tracking-wide text-[10px]">Input</p>
              <pre className="font-mono text-t300 text-[10px] whitespace-pre-wrap">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state === "output-available" && part.output != null && (
            <div className="px-3 py-2 bg-page-40">
              <p className="text-t600 mb-1 uppercase tracking-wide text-[10px]">Output</p>
              <pre className="font-mono text-t400 text-[10px] max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {typeof part.output === "string" ? part.output : JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
          {part.state === "output-error" && (
            <div className="px-3 py-2 bg-page-40">
              <p className="text-red-400 font-mono text-[10px]">{part.errorText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: EveMessage }) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  function toggleTool(id: string) {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (msg.role === "user") {
    const text = msg.parts.filter(p => p.type === "text").map(p => (p as { type: "text"; text: string }).text).join("");
    return (
      <div className="flex flex-col items-end max-w-[80%] self-end">
        <div className="px-5 py-3 text-[15px] leading-relaxed bg-amber-500 text-zinc-950 rounded-2xl rounded-br-sm">
          {text}
        </div>
      </div>
    );
  }

  // Assistant message — render parts in order.
  const toolParts = msg.parts.filter((p): p is EveDynamicToolPart => p.type === "dynamic-tool");
  const hasActiveTools = toolParts.some(p =>
    p.state === "input-streaming" || p.state === "input-available" || p.state === "approval-requested"
  );

  return (
    <div className="flex flex-col items-start max-w-[80%] self-start gap-1">
      {/* Active tool badges */}
      {hasActiveTools && (
        <div className="flex flex-wrap gap-1 mb-1">
          {toolParts
            .filter(p => p.state === "input-streaming" || p.state === "input-available")
            .map(p => (
              <span
                key={p.toolCallId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-th-sub text-t400 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-t500 animate-pulse" />
                {p.toolName.replace(/_/g, " ")}
              </span>
            ))
          }
        </div>
      )}

      {/* Main content bubble */}
      <div className="px-5 py-3.5 text-[15px] leading-[1.7] bg-card border border-th text-t200 rounded-2xl rounded-bl-sm w-full">
        {msg.parts.map((part, i) => {
          if (part.type === "text") {
            if (!part.text && msg.metadata?.status === "streaming") {
              return (
                <span key={i} className="inline-flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-t500 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-t500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-t500 animate-bounce [animation-delay:300ms]" />
                </span>
              );
            }
            return <AssistantMarkdown key={i} content={part.text} />;
          }
          if (part.type === "dynamic-tool") {
            return (
              <ToolCard
                key={part.toolCallId}
                part={part}
                expanded={expandedTools.has(part.toolCallId)}
                onToggle={() => toggleTool(part.toolCallId)}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent chat pane — remounts when activeThreadId changes via key prop
// ---------------------------------------------------------------------------

function AgentChatPane({
  token,
  thread,
  onSessionChange,
  onFirstUserMessage,
}: {
  token: string;
  thread: StoredThread;
  onSessionChange: (session: SessionState) => void;
  onFirstUserMessage: (title: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const firstMsgRef = useRef(thread.eveSession !== null);

  const agent = useEveAgent({
    auth: {
      bearer: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? "";
      },
    },
    initialSession: thread.eveSession ?? undefined,
    onSessionChange,
  });

  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.data.messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");

    if (!firstMsgRef.current) {
      firstMsgRef.current = true;
      onFirstUserMessage(text.slice(0, 80));
    }

    await agent.send({ message: text });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="px-6 py-4 border-b border-th flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-950" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-t50">Solar Assistant</p>
          <p className="text-xs text-t500">Ask anything about your plant data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {agent.data.messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-t50 tracking-tight">InvertixAI</h1>
            <p className="text-base text-t500 text-center max-w-xs leading-relaxed">
              Superintelligence for Renewable Energy
            </p>
          </div>
        )}

        {agent.data.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {agent.status === "error" && (
          <p className="text-xs text-red-400 text-center">Something went wrong. Try again.</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-th">
        <div className="flex items-end gap-3 bg-card border border-th rounded-2xl px-5 py-4 focus-within:border-amber-500/50 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your solar data… (Shift+Enter for new line)"
            className="flex-1 bg-transparent text-base text-t50 placeholder-t600 resize-none focus:outline-none"
            style={{ height: "28px", maxHeight: "160px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 transition-colors"
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-t600 mt-2 text-center">
          Agent has access to your plant data — queries are scoped to your company.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatPage — thread sidebar + active chat
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [threads, setThreads] = useState<StoredThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { clearStoredThreads(); router.replace("/"); return; }
      setToken(data.session.access_token);
      setThreads(loadThreads());
    });
  }, [router]);

  const activeThread = threads.find(t => t.id === activeThreadId) ?? null;

  function newThread() {
    const id = crypto.randomUUID();
    const thread: StoredThread = {
      id,
      title: "New conversation",
      eveSession: null,
      created_at: new Date().toISOString(),
    };
    const updated = [thread, ...threads];
    setThreads(updated);
    saveThreads(updated);
    setActiveThreadId(id);
  }

  function handleSessionChange(session: SessionState) {
    setThreads(prev => {
      const updated = prev.map(t =>
        t.id === activeThreadId ? { ...t, eveSession: session } : t
      );
      saveThreads(updated);
      return updated;
    });
  }

  function handleFirstUserMessage(title: string) {
    setThreads(prev => {
      const updated = prev.map(t =>
        t.id === activeThreadId ? { ...t, title } : t
      );
      saveThreads(updated);
      return updated;
    });
  }

  async function handleDeleteThread(e: MouseEvent<HTMLButtonElement>, threadId: string) {
    e.stopPropagation();
    const updated = threads.filter(t => t.id !== threadId);
    setThreads(updated);
    saveThreads(updated);
    if (activeThreadId === threadId) setActiveThreadId(null);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-t400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-page">
      {/* Thread sidebar */}
      <aside className="w-72 shrink-0 border-r border-th flex flex-col bg-page">
        <div className="px-4 py-4 border-b border-th flex items-center justify-between">
          <span className="text-[13px] font-semibold text-t300 tracking-wide">Conversations</span>
          <button
            onClick={newThread}
            title="New conversation"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-t400 hover:text-amber-500 hover:bg-surface transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2.5 text-xs text-t400 hover:text-t50 hover:bg-surface transition-colors border-b border-th"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Dashboard
        </button>

        <div className="flex-1 overflow-y-auto py-2">
          {threads.length === 0 && (
            <p className="text-xs text-t600 px-4 pt-4 text-center">No conversations yet.</p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-1 px-2 py-1.5 transition-colors ${
                t.id === activeThreadId ? "bg-surface-80" : "hover:bg-surface-40"
              }`}
            >
              <button
                onClick={() => setActiveThreadId(t.id)}
                className={`flex-1 text-left text-[13px] truncate px-2 py-1 rounded-lg leading-snug ${
                  t.id === activeThreadId ? "text-t50 font-medium" : "text-t400 group-hover:text-t300"
                }`}
              >
                {t.title || "Untitled conversation"}
              </button>
              <button
                onClick={(e) => handleDeleteThread(e, t.id)}
                title="Delete conversation"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-t600 hover:text-red-400 hover:bg-surface-deep opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      {activeThread ? (
        <AgentChatPane
          key={activeThread.id}
          token={token}
          thread={activeThread}
          onSessionChange={handleSessionChange}
          onFirstUserMessage={handleFirstUserMessage}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-t500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-t600" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-sm">Select a conversation or start a new one.</p>
          <button
            onClick={newThread}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors"
          >
            New conversation
          </button>
        </div>
      )}
    </div>
  );
}
