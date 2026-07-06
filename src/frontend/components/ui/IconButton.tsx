'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Tooltip from "./Tooltip";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  variant?: "ghost" | "danger" | "accent";
  size?: "sm" | "md";
  tooltipSide?: "top" | "bottom" | "right";
};

const sizeClasses: Record<"sm" | "md", string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
};

const variantClasses: Record<"ghost" | "danger" | "accent", string> = {
  ghost: "text-t400 hover:text-t50 hover:bg-surface-60",
  danger: "text-t600 hover:text-red-400 hover:bg-red-500/10",
  accent: "text-t400 hover:text-amber-500 hover:bg-surface",
};

// Icon-only action button: 40x40 default touch target, tooltip + aria-label
// for accessibility, subtle hover/press feedback (scale down on :active).
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "ghost", size = "md", tooltipSide, className = "", ...props },
  ref
) {
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
});

export default IconButton;
