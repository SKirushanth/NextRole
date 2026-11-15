import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
} from "lucide-react";

// --- Constants ---
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Period = "AM" | "PM";

interface CalendarDayCell {
  day: number;
  isOutsideMonth: boolean;
  date: Date;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface DatePickerProProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Compact Framer-inspired Date & Time Picker Component
 */
export function DatePickerPro({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
}: DatePickerProProps) {
  const today = useMemo(() => new Date(), []);

  // Popover & view state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMonthYearMode, setIsMonthYearMode] = useState<boolean>(false);

  // Calendar viewport state
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // Selected date state (supports both controlled & uncontrolled usage)
  const [internalDate, setInternalDate] = useState<Date | null>(value ?? null);
  const selectedDate = value !== undefined ? value : internalDate;

  // Time state
  const initialHrs24 = today.getHours();
  const [period, setPeriod] = useState<Period>(initialHrs24 >= 12 ? "PM" : "AM");
  const [hour12, setHour12] = useState<number>(
    initialHrs24 % 12 === 0 ? 12 : initialHrs24 % 12
  );
  const [minute, setMinute] = useState<number>(today.getMinutes());

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes if used as controlled component
  useEffect(() => {
    if (value !== undefined) {
      setInternalDate(value);
      if (value) {
        setViewYear(value.getFullYear());
        setViewMonth(value.getMonth());
        const hrs = value.getHours();
        setPeriod(hrs >= 12 ? "PM" : "AM");
        setHour12(hrs % 12 === 0 ? 12 : hrs % 12);
        setMinute(value.getMinutes());
      }
    }
  }, [value]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closePopover();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const buildCombinedDate = (
    baseDate: Date,
    h12: number,
    min: number,
    ampm: Period
  ): Date => {
    let hrs24 = h12 % 12;
    if (ampm === "PM") hrs24 += 12;
    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hrs24,
      min,
      0,
      0
    );
  };

  const commitDateChange = (
    nextBaseDate: Date | null,
    nextH12 = hour12,
    nextMin = minute,
    nextPeriod = period
  ) => {
    if (!nextBaseDate) {
      setInternalDate(null);
      onChange?.(null);
      return;
    }
    const combined = buildCombinedDate(nextBaseDate, nextH12, nextMin, nextPeriod);
    setInternalDate(combined);
    onChange?.(combined);
  };

  const closePopover = () => {
    setIsOpen(false);
    setIsMonthYearMode(false);
  };

  const navigatePeriod = (delta: number) => {
    if (isMonthYearMode) {
      setViewYear((prev) => prev + delta);
    } else {
      let nextMonth = viewMonth + delta;
      let nextYear = viewYear;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      } else if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      }
      setViewMonth(nextMonth);
      setViewYear(nextYear);
    }
  };

  const calendarCells = useMemo<CalendarDayCell[]>(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: CalendarDayCell[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push({
        day,
        isOutsideMonth: true,
        date: new Date(viewYear, viewMonth - 1, day),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        isOutsideMonth: false,
        date: new Date(viewYear, viewMonth, day),
      });
    }

    const totalCells = firstDayIndex + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      cells.push({
        day,
        isOutsideMonth: true,
        date: new Date(viewYear, viewMonth + 1, day),
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const stepHour = (delta: number) => {
    const nextHour = ((hour12 - 1 + delta + 12) % 12) + 1;
    setHour12(nextHour);
    const targetBase = selectedDate ?? new Date(viewYear, viewMonth, today.getDate());
    commitDateChange(targetBase, nextHour, minute, period);
  };

  const stepMinute = (delta: number) => {
    const nextMin = (minute + delta + 60) % 60;
    setMinute(nextMin);
    const targetBase = selectedDate ?? new Date(viewYear, viewMonth, today.getDate());
    commitDateChange(targetBase, hour12, nextMin, period);
  };

  const handleTimeWheel = (e: React.WheelEvent<HTMLSpanElement>, unit: "hour" | "minute") => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    if (unit === "hour") {
      stepHour(delta);
    } else {
      stepMinute(delta);
    }
  };

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    const targetBase = selectedDate ?? new Date(viewYear, viewMonth, today.getDate());
    commitDateChange(targetBase, hour12, minute, nextPeriod);
  };

  const handleSelectToday = () => {
    const now = new Date();
    const hrs24 = now.getHours();
    const nextPeriod: Period = hrs24 >= 12 ? "PM" : "AM";
    const nextHour12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
    const nextMin = now.getMinutes();

    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setPeriod(nextPeriod);
    setHour12(nextHour12);
    setMinute(nextMin);
    commitDateChange(now, nextHour12, nextMin, nextPeriod);
  };

  const handleClear = () => {
    commitDateChange(null);
  };

  const handleDone = () => {
    if (!selectedDate) {
      const fallback = new Date(viewYear, viewMonth, today.getDate());
      commitDateChange(fallback, hour12, minute, period);
    }
    closePopover();
  };

  const formattedTriggerText = useMemo(() => {
    if (!selectedDate) return placeholder;
    const day = pad(selectedDate.getDate());
    const month = pad(selectedDate.getMonth() + 1);
    const year = selectedDate.getFullYear();
    const hrs24 = pad(selectedDate.getHours());
    const mins = pad(selectedDate.getMinutes());
    return `${day}/${month}/${year} ${hrs24}:${mins}`;
  }, [selectedDate, placeholder]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Trigger Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="w-full h-10 px-3.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 flex items-center justify-between text-left transition-all duration-150 cursor-pointer"
      >
        <span
          className={`text-[13px] font-medium truncate ${
            selectedDate ? "text-[#1F2937]" : "text-gray-400"
          }`}
        >
          {formattedTriggerText}
        </span>

        <CalendarIcon
          strokeWidth={2}
          className="w-4 h-4 text-[#111827] shrink-0"
        />
      </button>

      {/* 2. Calendar + Time Popover (Compact & High Contrast) */}
      <div
        role="dialog"
        aria-label="Choose date and time"
        style={{ transformOrigin: "top center" }}
        className={`absolute top-[calc(100%+6px)] right-0 w-[260px] rounded-xl bg-white shadow-xl border border-zinc-200/90 p-2.5 z-50 transition-all duration-200 ease-out text-zinc-900 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 visible pointer-events-auto"
            : "opacity-0 -translate-y-1.5 scale-[0.96] invisible pointer-events-none"
        }`}
      >
        {/* Header: Month/Year Toggle & Prev/Next Arrows */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <button
            type="button"
            onClick={() => setIsMonthYearMode((prev) => !prev)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 -ml-1 rounded-md text-[12.5px] font-semibold tracking-tight text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <span>
              {isMonthYearMode ? `${viewYear}` : `${MONTH_NAMES[viewMonth]} ${viewYear}`}
            </span>
            <ChevronDown
              strokeWidth={2.2}
              className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${
                isMonthYearMode ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => navigatePeriod(-1)}
              aria-label="Previous"
              className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors active:scale-95 cursor-pointer"
            >
              <ChevronLeft strokeWidth={2.2} className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigatePeriod(1)}
              aria-label="Next"
              className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors active:scale-95 cursor-pointer"
            >
              <ChevronRight strokeWidth={2.2} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View A: 7-Column Days Grid */}
        {!isMonthYearMode ? (
          <div>
            <div className="grid grid-cols-7 mb-1 text-center">
              {WEEKDAYS.map((dayLabel) => (
                <span
                  key={dayLabel}
                  className="text-[10px] font-semibold text-zinc-400"
                >
                  {dayLabel}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {calendarCells.map((cell, index) => {
                const isTodayCell = !cell.isOutsideMonth && isSameDay(cell.date, today);
                const isSelectedCell =
                  !cell.isOutsideMonth &&
                  selectedDate !== null &&
                  isSameDay(cell.date, selectedDate);

                let cellStyle =
                  "relative w-7 h-7 mx-auto rounded-md text-[11.5px] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer ";

                if (isSelectedCell) {
                  cellStyle +=
                    "bg-indigo-600 text-white font-semibold shadow-xs";
                } else if (cell.isOutsideMonth) {
                  cellStyle +=
                    "text-zinc-300 hover:bg-zinc-100/70";
                } else if (isTodayCell) {
                  cellStyle +=
                    "text-indigo-600 font-semibold bg-indigo-50 hover:bg-indigo-100/80";
                } else {
                  cellStyle +=
                    "text-zinc-700 font-medium hover:bg-zinc-100";
                }

                return (
                  <button
                    key={`${cell.date.toISOString()}-${index}`}
                    type="button"
                    onClick={() => {
                      if (cell.isOutsideMonth) {
                        setViewYear(cell.date.getFullYear());
                        setViewMonth(cell.date.getMonth());
                      }
                      commitDateChange(cell.date);
                    }}
                    className={cellStyle}
                  >
                    {cell.day}
                    {isTodayCell && !isSelectedCell && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* View B: Quick Month Selector Grid */
          <div className="py-1 grid grid-cols-3 gap-1">
            {SHORT_MONTH_NAMES.map((name, idx) => {
              const isCurrentViewMonth = idx === viewMonth;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setIsMonthYearMode(false);
                  }}
                  className={`py-1.5 rounded-md text-[11.5px] font-medium transition-all active:scale-95 cursor-pointer ${
                    isCurrentViewMonth
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {/* Integrated Time Picker Row with Up/Down Arrows */}
        <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock strokeWidth={1.9} className="w-3 h-3 text-zinc-400" />
            <span className="text-[11px] font-medium">Time</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Hour & Minute Stepper Pill */}
            <div className="inline-flex items-center bg-zinc-50 border border-zinc-200/80 rounded-md px-1 py-0.5 gap-0.5">
              {/* Hour Stepper */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepHour(1)}
                  aria-label="Increase hour"
                  className="w-5 h-3 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronUp strokeWidth={2.6} className="w-2.5 h-2.5" />
                </button>
                <span
                  onWheel={(e) => handleTimeWheel(e, "hour")}
                  title="Scroll or use arrows to adjust hour"
                  className="text-[11.5px] font-semibold text-zinc-900 w-5 text-center tabular-nums leading-none select-none cursor-ns-resize"
                >
                  {String(hour12).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => stepHour(-1)}
                  aria-label="Decrease hour"
                  className="w-5 h-3 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronDown strokeWidth={2.6} className="w-2.5 h-2.5" />
                </button>
              </div>

              <span className="text-[11px] font-semibold text-zinc-400 select-none pb-0.5">
                :
              </span>

              {/* Minute Stepper */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepMinute(1)}
                  aria-label="Increase minute"
                  className="w-5 h-3 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronUp strokeWidth={2.6} className="w-2.5 h-2.5" />
                </button>
                <span
                  onWheel={(e) => handleTimeWheel(e, "minute")}
                  title="Scroll or use arrows to adjust minute"
                  className="text-[11.5px] font-semibold text-zinc-900 w-5 text-center tabular-nums leading-none select-none cursor-ns-resize"
                >
                  {String(minute).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => stepMinute(-1)}
                  aria-label="Decrease minute"
                  className="w-5 h-3 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronDown strokeWidth={2.6} className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* AM / PM Segmented Pill */}
            <div className="inline-flex items-center bg-zinc-50 border border-zinc-200/80 rounded-md p-0.5 text-[10px] font-semibold">
              {(["AM", "PM"] as Period[]).map((p) => {
                const isActive = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodChange(p)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-zinc-900 shadow-xs border border-black/[0.06]"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Today
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default DatePickerPro;
