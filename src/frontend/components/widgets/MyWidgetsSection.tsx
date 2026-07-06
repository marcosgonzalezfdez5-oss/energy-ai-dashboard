'use client'

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { listWidgets, renameWidget, softDeleteWidget, restoreWidget, reorderWidgets } from "@/lib/widgets";
import { WidgetRow } from "@/lib/widget-config";
import WidgetRenderer from "./registry";
import WidgetErrorBoundary from "./WidgetErrorBoundary";
import IconButton from "@/components/ui/IconButton";
import Toast from "@/components/ui/Toast";

// Chat and dashboard are separate routes, so navigating between them already
// remounts this component (covering "create in chat, come back to
// dashboard"). The one gap that doesn't cover is a dashboard tab left open
// while a widget is created from chat in another tab — a throttled focus
// refetch covers that without needing Supabase Realtime.
const FOCUS_REFETCH_MIN_INTERVAL_MS = 60_000;
const UNDO_TIMEOUT_MS = 6_000;

type Props = { token: string };

export default function MyWidgetsSection({ token }: Props) {
  const [widgets, setWidgets] = useState<WidgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [removedToast, setRemovedToast] = useState<{ widget: WidgetRow; index: number } | null>(null);
  const lastFetchAt = useRef(0);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    lastFetchAt.current = Date.now();
    listWidgets()
      .then((rows) => {
        if (!cancelled) setWidgets(rows);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onFocus() {
      if (Date.now() - lastFetchAt.current < FOCUS_REFETCH_MIN_INTERVAL_MS) return;
      lastFetchAt.current = Date.now();
      listWidgets().then(setWidgets).catch(console.error);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function startRename(widget: WidgetRow) {
    setRenaming({ id: widget.id, value: widget.title });
  }

  async function saveRename() {
    if (!renaming) return;
    const { id, value } = renaming;
    const title = value.trim();
    setRenaming(null);
    if (!title) return;
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, title } : w)));
    try {
      await renameWidget(id, title);
    } catch (e) {
      console.error("Failed to rename widget", e);
    }
  }

  function handleDelete(widget: WidgetRow) {
    const index = widgets.findIndex((w) => w.id === widget.id);
    setWidgets((prev) => prev.filter((w) => w.id !== widget.id));
    softDeleteWidget(widget.id).catch((e) => console.error("Failed to remove widget", e));

    if (undoTimer.current) clearTimeout(undoTimer.current);
    setRemovedToast({ widget, index });
    undoTimer.current = setTimeout(() => setRemovedToast(null), UNDO_TIMEOUT_MS);
  }

  function moveWidget(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= widgets.length) return;
    setWidgets((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      reorderWidgets(next.map((w) => w.id)).catch((e) => console.error("Failed to reorder widgets", e));
      return next;
    });
  }

  function handleUndo() {
    if (!removedToast) return;
    const { widget, index } = removedToast;
    restoreWidget(widget.id).catch((e) => console.error("Failed to restore widget", e));
    setWidgets((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, widget);
      return next;
    });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setRemovedToast(null);
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-t50 mb-4">My Widgets</h2>
        <p className="text-t500 text-sm">Loading…</p>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-t50 mb-4">My Widgets</h2>
        <p className="text-t500 text-sm">
          Ask the assistant to create a chart or KPI — e.g. &quot;create a chart of today&apos;s energy production&quot; — and it&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-t50 mb-4">My Widgets</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets.map((widget, index) => (
          <div key={widget.id} className={widget.widget_type === "comparison_chart" ? "lg:col-span-2" : ""}>
            <div className="relative group">
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <IconButton
                  icon={<ChevronUp className="h-4 w-4" aria-hidden="true" />}
                  label="Move up"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => moveWidget(index, -1)}
                />
                <IconButton
                  icon={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  label="Move down"
                  size="sm"
                  disabled={index === widgets.length - 1}
                  onClick={() => moveWidget(index, 1)}
                />
                <IconButton
                  icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  label="Rename widget"
                  size="sm"
                  onClick={() => startRename(widget)}
                />
                <IconButton
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  label="Remove widget"
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(widget)}
                />
              </div>

              {renaming?.id === widget.id && (
                <div className="absolute right-4 top-14 z-20 flex items-center gap-2 bg-surface-deep border border-th-sub rounded-lg p-2 shadow-lg">
                  <input
                    autoFocus
                    aria-label="Widget title"
                    value={renaming.value}
                    onChange={(e) => setRenaming({ id: widget.id, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename();
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    className="h-8 rounded-md border border-th-sub bg-surface px-2 text-sm text-t50 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <IconButton
                    icon={<Check className="h-4 w-4" aria-hidden="true" />}
                    label="Save title"
                    size="sm"
                    onClick={saveRename}
                  />
                  <IconButton
                    icon={<X className="h-4 w-4" aria-hidden="true" />}
                    label="Cancel"
                    size="sm"
                    onClick={() => setRenaming(null)}
                  />
                </div>
              )}

              <WidgetErrorBoundary fallbackTitle={widget.title}>
                <WidgetRenderer widget={widget} token={token} />
              </WidgetErrorBoundary>
            </div>
          </div>
        ))}
      </div>

      {removedToast && (
        <Toast
          message={`"${removedToast.widget.title}" removed`}
          actionLabel="Undo"
          onAction={handleUndo}
          onDismiss={() => setRemovedToast(null)}
        />
      )}
    </div>
  );
}
