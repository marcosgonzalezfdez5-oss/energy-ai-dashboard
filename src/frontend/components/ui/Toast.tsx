'use client'

import { X } from "lucide-react";

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
};

// No toast library exists in this repo — a small bespoke component is
// proportional here, consistent with the codebase's existing preference for
// hand-rolled UI (IconButton, Tooltip) over pulling in a dependency.
export default function Toast({ message, actionLabel, onAction, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-surface-deep border border-th-sub rounded-xl px-4 py-3 shadow-lg"
    >
      <span className="text-sm text-t100">{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-t500 hover:text-t200 transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
