'use client'

import { useState, useRef, useEffect } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

type Props = {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  label?: string;
  align?: "left" | "right";
};

function parseLocal(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(s: string): string {
  const d = parseLocal(s);
  if (!d) return "";
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange, min, max, label, align = "left" }: Props) {
  const today = new Date();
  const seeded = parseLocal(value) ?? today;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(seeded.getFullYear());
  const [viewMonth, setViewMonth] = useState(seeded.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = parseLocal(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build 42-cell grid
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { ymd: string; day: number; current: boolean };
  const cells: Cell[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrev - i);
    cells.push({ ymd: toYMD(d), day: d.getDate(), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ ymd: toYMD(new Date(viewYear, viewMonth, d)), day: d, current: true });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ ymd: toYMD(new Date(viewYear, viewMonth + 1, next)), day: next++, current: false });
  }

  const isDisabled = (ymd: string) => (min && ymd < min) || (max && ymd > max);

  const minYear = min ? parseInt(min.slice(0, 4)) : today.getFullYear() - 10;
  const maxYear = max ? parseInt(max.slice(0, 4)) : today.getFullYear() + 5;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex flex-col text-left"
      >
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-t600 font-medium leading-none mb-1">
            {label}
          </span>
        )}
        <span className={`text-sm leading-none ${value ? "text-t200" : "text-t500"}`}>
          {value ? formatDisplay(value) : "Select date"}
        </span>
      </button>

      {/* Calendar */}
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 bg-card border border-th rounded-2xl p-4 shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ width: 280 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-t400 hover:text-t50 hover:bg-surface-deep transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                className="bg-surface text-t50 text-sm font-semibold rounded-lg px-2 py-1 border border-th focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="bg-surface text-t50 text-sm font-semibold rounded-lg px-2 py-1 border border-th focus:outline-none cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-t400 hover:text-t50 hover:bg-surface-deep transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="h-8 flex items-center justify-center text-[11px] font-medium text-t500">
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map(({ ymd, day, current }, idx) => {
              const selected = ymd === value;
              const disabled = isDisabled(ymd);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { if (!disabled) { onChange(ymd); setOpen(false); } }}
                  disabled={!!disabled}
                  className={`h-8 flex items-center justify-center text-sm rounded-full transition-colors ${
                    selected
                      ? "bg-amber-500 text-zinc-950 font-semibold"
                      : disabled
                        ? "text-t600 opacity-30 cursor-not-allowed"
                        : current
                          ? "text-t200 hover:bg-surface-deep"
                          : "text-t600 hover:bg-surface"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear */}
          {value && (
            <div className="mt-3 pt-3 border-t border-th">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-sm text-t500 hover:text-t300 transition-colors"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
