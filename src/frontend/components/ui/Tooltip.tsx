'use client'

import { cloneElement, useId, type ReactElement } from "react";

type TooltipProps = {
  label: string;
  side?: "top" | "bottom" | "right";
  children: ReactElement<{ "aria-describedby"?: string }>;
};

// CSS-only tooltip: no JS state, shows on hover and keyboard focus alike,
// and wires aria-describedby so screen readers announce the label too.
export default function Tooltip({ label, side = "bottom", children }: TooltipProps) {
  const id = useId();
  const sideClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "right"
        ? "left-full top-1/2 -translate-y-1/2 ml-2"
        : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span className="relative inline-flex group/tooltip">
      {cloneElement(children, { "aria-describedby": id })}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-th-sub bg-surface-deep px-2 py-1 text-xs text-t100 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100 ${sideClasses}`}
      >
        {label}
      </span>
    </span>
  );
}
