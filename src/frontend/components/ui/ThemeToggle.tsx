'use client'

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

// Animated iOS-style switch: track color, thumb position and the sun/moon
// icon crossfade all transition together (200ms) so flipping themes feels
// like one continuous motion rather than an instant swap.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
        isDark ? "bg-surface-deep" : "bg-amber-500/40"
      }`}
    >
      <span
        className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
          isDark ? "translate-x-5" : "translate-x-0"
        }`}
      >
        <Sun
          aria-hidden="true"
          className={`absolute h-3 w-3 text-amber-500 transition-all duration-150 ${
            isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`absolute h-3 w-3 text-zinc-700 transition-all duration-150 ${
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
