"use client";

import { motion } from "framer-motion";
import { enGB, enUS, ja } from "date-fns/locale";
import type { Locale } from "date-fns";
import { toPng } from "html-to-image";
import Image, { StaticImageData } from "next/image";
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import aprImg from "@/assets/apr.jpg";
import augImg from "@/assets/aug.jpg";
import decImg from "@/assets/dec.jpg";
import febImg from "@/assets/feb.jpg";
import janImg from "@/assets/jan.jpg";
import julImg from "@/assets/jul.jpg";
import junImg from "@/assets/jun.jpg";
import marImg from "@/assets/mar.jpg";
import mayImg from "@/assets/may.jpg";
import novImg from "@/assets/nov.jpg";
import octImg from "@/assets/oct.jpg";
import sepImg from "@/assets/sep.jpg";
import {
  buildMonthGrid,
  buildWeekdayLabels,
  getMonthKey,
  isBetweenInclusive,
  isSameDay,
  toIsoDate,
} from "@/lib/calendar";

type DateRange = {
  start: Date | null;
  end: Date | null;
};

type MonthTheme = {
  accent: string;
  secondary: string;
  crescent: string;
  ink: string;
};

type TimeContext = {
  id: string;
  label: string;
  locale: string;
  timeZone: string;
  weekStartsOn: 0 | 1;
  dateLocale: Locale;
};

const MONTH_IMAGES: StaticImageData[] = [
  janImg,
  febImg,
  marImg,
  aprImg,
  mayImg,
  junImg,
  julImg,
  augImg,
  sepImg,
  octImg,
  novImg,
  decImg,
];

const MONTH_THEMES: MonthTheme[] = [
  { accent: "#1F8EF1", secondary: "#4CC9F0", crescent: "#F9C74F", ink: "#0D3B66" },
  { accent: "#E15554", secondary: "#F4A261", crescent: "#F6D365", ink: "#5F0F40" },
  { accent: "#2A9D8F", secondary: "#80ED99", crescent: "#F4D35E", ink: "#104F55" },
  { accent: "#F77F00", secondary: "#FCBF49", crescent: "#FFE8A3", ink: "#7A4E00" },
  { accent: "#277DA1", secondary: "#4D9DE0", crescent: "#F9C784", ink: "#133C55" },
  { accent: "#8338EC", secondary: "#3A86FF", crescent: "#FFBE0B", ink: "#3A1C71" },
  { accent: "#00A896", secondary: "#02C39A", crescent: "#F0C808", ink: "#0B525B" },
  { accent: "#FF6B6B", secondary: "#FF9770", crescent: "#FFD670", ink: "#6D213C" },
  { accent: "#5C7AEA", secondary: "#8DA9FF", crescent: "#F7D794", ink: "#1D3557" },
  { accent: "#06D6A0", secondary: "#1B9AAA", crescent: "#FFE66D", ink: "#0B3C49" },
  { accent: "#F94144", secondary: "#F3722C", crescent: "#F9C74F", ink: "#5A1E2B" },
  { accent: "#577590", secondary: "#43AA8B", crescent: "#F9D976", ink: "#23395D" },
];

const NOTES_STORAGE_KEY = "interactive-calendar-notes-v1";
const CALENDAR_YEAR = 2026;

const TIME_CONTEXTS: TimeContext[] = [
  {
    id: "us",
    label: "USA (New York)",
    locale: "en-US",
    timeZone: "America/New_York",
    weekStartsOn: 0,
    dateLocale: enUS,
  },
  {
    id: "india",
    label: "India (Kolkata)",
    locale: "en-IN",
    timeZone: "Asia/Kolkata",
    weekStartsOn: 1,
    dateLocale: enGB,
  },
  {
    id: "japan",
    label: "Japan (Tokyo)",
    locale: "ja-JP",
    timeZone: "Asia/Tokyo",
    weekStartsOn: 1,
    dateLocale: ja,
  },
];

const HOLIDAY_HINTS: Record<number, Record<number, string>> = {
  0: { 1: "New Year" },
  1: { 14: "Valentine" },
  2: { 17: "Spring Trip" },
  5: { 21: "Longest Day" },
  6: { 4: "Adventure" },
  9: { 31: "Halloween" },
  11: { 25: "Holiday" },
};

export function WallCalendar() {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(CALENDAR_YEAR, now.getMonth(), 1);
  });
  const [monthDirection, setMonthDirection] = useState(1);
  const [flipPhase, setFlipPhase] = useState<"idle" | "turning">("idle");
  const [timeContext, setTimeContext] = useState<TimeContext>(TIME_CONTEXTS[0]);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [monthNotes, setMonthNotes] = useState<Record<string, string>>(() => {
    const stored = readStoredNotes();
    return stored.monthNotes;
  });
  const [rangeNotes, setRangeNotes] = useState<Record<string, string>>(() => {
    const stored = readStoredNotes();
    return stored.rangeNotes;
  });
  const [monthEditing, setMonthEditing] = useState(true);
  const [rangeEditing, setRangeEditing] = useState(false);
  const [dynamicTheme, setDynamicTheme] = useState<MonthTheme | null>(null);
  const [glowState, setGlowState] = useState({ x: 0, y: 0, visible: false });

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const flipCommitTimerRef = useRef<number | null>(null);
  const flipFinishTimerRef = useRef<number | null>(null);
  const isFlipping = flipPhase === "turning";

  const monthKey = getMonthKey(monthDate);
  const todayInContext = useMemo(
    () => getDateForTimeZone(timeContext.timeZone),
    [timeContext.timeZone],
  );
  const monthDays = useMemo(
    () =>
      buildMonthGrid(monthDate, {
        weekStartsOn: timeContext.weekStartsOn,
        todayDate: todayInContext,
      }),
    [monthDate, timeContext.weekStartsOn, todayInContext],
  );
  const weekdayLabels = useMemo(
    () => buildWeekdayLabels(timeContext.weekStartsOn, timeContext.dateLocale),
    [timeContext.weekStartsOn, timeContext.dateLocale],
  );
  const fallbackTheme = MONTH_THEMES[monthDate.getMonth()];
  const heroImage = MONTH_IMAGES[monthDate.getMonth()];
  const theme = dynamicTheme ?? fallbackTheme;
  const monthNote = monthNotes[monthKey] ?? "";
  const rangeKey = getRangeKey(range.start, range.end);
  const activeRangeNote = rangeKey ? rangeNotes[rangeKey] ?? "" : "";
  const glowColor = useMemo(() => hexToRgba(theme.accent, 0.35), [theme.accent]);
  const monthName = new Intl.DateTimeFormat(timeContext.locale, {
    month: "long",
  }).format(monthDate);
  const monthYearLabel = new Intl.DateTimeFormat(timeContext.locale, {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify({ monthNotes, rangeNotes }),
    );
  }, [monthNotes, rangeNotes]);

  useEffect(() => {
    let active = true;

    extractImageTheme(heroImage.src)
      .then((derivedTheme) => {
        if (active) {
          setDynamicTheme(derivedTheme);
        }
      })
      .catch(() => {
        if (active) {
          setDynamicTheme(null);
        }
      });

    return () => {
      active = false;
    };
  }, [heroImage.src]);

  useEffect(() => {
    return () => {
      if (flipCommitTimerRef.current) {
        window.clearTimeout(flipCommitTimerRef.current);
      }
      if (flipFinishTimerRef.current) {
        window.clearTimeout(flipFinishTimerRef.current);
      }
    };
  }, []);

  function selectDay(day: Date, isCurrentMonth: boolean) {
    if (!isCurrentMonth) {
      return;
    }

    if (range.start && !range.end && isSameDay(day, range.start)) {
      setRange({ start: null, end: null });
      return;
    }

    if (!range.start || (range.start && range.end)) {
      setRange({ start: day, end: null });
      setRangeEditing(true);
      return;
    }

    if (day.getTime() < range.start.getTime()) {
      setRange({ start: day, end: range.start });
      return;
    }

    setRange({ start: range.start, end: day });
  }

  function clearRange() {
    setRange({ start: null, end: null });
  }

  function deleteSelectedRange() {
    if (rangeKey) {
      setRangeNotes((prev) => {
        const next = { ...prev };
        delete next[rangeKey];
        return next;
      });
    }

    clearRange();
  }

  function animateToMonth(targetMonth: number, direction: number) {
    const currentMonth = monthDate.getMonth();
    if (targetMonth === currentMonth || isFlipping) {
      return;
    }

    if (flipCommitTimerRef.current) {
      window.clearTimeout(flipCommitTimerRef.current);
    }
    if (flipFinishTimerRef.current) {
      window.clearTimeout(flipFinishTimerRef.current);
    }

    setMonthDirection(direction);
    setFlipPhase("turning");
    clearRange();

    const nextDate = new Date(CALENDAR_YEAR, targetMonth, 1);

    flipCommitTimerRef.current = window.setTimeout(() => {
      setMonthDate(nextDate);
    }, 420);

    flipFinishTimerRef.current = window.setTimeout(() => {
      setFlipPhase("idle");
    }, 840);
  }

  function goToMonth(offset: number) {
    const currentMonth = monthDate.getMonth();
    const nextMonth = Math.min(11, Math.max(0, currentMonth + offset));
    animateToMonth(nextMonth, offset > 0 ? 1 : -1);
  }

  function jumpToCurrentMonth() {
    const now = new Date();
    const targetMonth = now.getMonth();
    const direction = targetMonth >= monthDate.getMonth() ? 1 : -1;
    animateToMonth(targetMonth, direction);
  }

  function onContextChange(contextId: string) {
    const next = TIME_CONTEXTS.find((entry) => entry.id === contextId);
    if (!next) {
      return;
    }

    setTimeContext(next);
    clearRange();
  }

  function onMonthNoteChange(value: string) {
    setMonthNotes((prev) => ({
      ...prev,
      [monthKey]: value,
    }));
  }

  function onRangeNoteChange(value: string) {
    if (!rangeKey) {
      return;
    }

    setRangeNotes((prev) => ({
      ...prev,
      [rangeKey]: value,
    }));
  }

  const handleDownload = async () => {
    if (!calendarRef.current) {
      console.error("Calendar ref is not attached.");
      return;
    }

    try {
      const dataUrl = await toPng(calendarRef.current, {
        cacheBust: true,
        backgroundColor: "#f3f4f6",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "my-calendar-month.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export calendar:", error);
      alert("Oops! Could not download the image. Check the console.");
    }
  };

  function onGridMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!gridRef.current) {
      return;
    }

    const box = gridRef.current.getBoundingClientRect();
    setGlowState({
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      visible: true,
    });
  }

  function onGridMouseLeave() {
    setGlowState((prev) => ({ ...prev, visible: false }));
  }

  return (
    <section
      className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-8"
      style={
        {
          "--accent": theme.accent,
          "--secondary": theme.secondary,
          "--crescent": theme.crescent,
          "--ink": theme.ink,
        } as CSSProperties
      }
    >
      <div ref={calendarRef} className="sheet-shell rounded-[2rem] p-2 shadow-[0_26px_70px_rgba(16,26,40,0.2)]">
        <div className="calendar-shell relative overflow-hidden rounded-[1.6rem]">
          <div className="pin-icon absolute left-1/2 top-1 -translate-x-1/2" aria-hidden="true">
            <span className="pin-head" />
            <span className="pin-stem" />
            <span className="pin-tip" />
          </div>
          <div className="absolute left-0 right-0 top-6 flex justify-center gap-2 px-6">
            {Array.from({ length: 22 }).map((_, index) => (
              <span key={`ring-${index}`} className="h-2 w-2 rounded-full border border-zinc-500 bg-white/80" />
            ))}
          </div>

          <div className="relative z-10 mt-10 grid min-h-[760px] grid-rows-[380px_1fr] md:min-h-[860px] md:grid-rows-[460px_1fr]">
            <div className="flip-stage h-full">
              <div
                className={[
                  "month-flip-base month-flip-hero relative h-full overflow-hidden",
                  monthDirection > 0 ? "month-flip-forward" : "month-flip-backward",
                  flipPhase === "turning" ? "flip-turning" : "",
                ].join(" ")}
              >
                <Image
                  src={heroImage}
                  alt={`${monthYearLabel} hero view`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1024px"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/15 via-zinc-900/5 to-zinc-900/40" />
                <div className="crescent-badge absolute left-6 top-6 h-12 w-12 rounded-full bg-[color:var(--crescent)]/90" />

                <div className="absolute right-6 top-6 rounded-2xl bg-black/25 px-4 py-2 text-right text-white backdrop-blur-sm">
                  <h2 className="font-wallcal text-6xl leading-none md:text-7xl">{monthName}</h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 pb-6 md:grid-cols-[0.9fr_1.2fr] md:gap-6 md:p-7">
              <aside className="calendar-panel rounded-3xl p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]">
                    Notes
                  </h3>
                  <span className="rounded-full bg-[color:var(--accent)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]">
                    Month Memo
                  </span>
                </div>

                <NoteEditor
                  value={monthNote}
                  onChange={onMonthNoteChange}
                  editing={monthEditing}
                  setEditing={setMonthEditing}
                  placeholder="Capture your monthly intention, goals, reminders..."
                  className="h-36"
                />

                <div className="mt-4 space-y-2">
                  <p className="font-caveat text-2xl text-[color:var(--ink)]">Range Notes</p>
                  <NoteEditor
                    value={activeRangeNote}
                    onChange={onRangeNoteChange}
                    editing={rangeEditing}
                    setEditing={setRangeEditing}
                    disabled={!rangeKey}
                    placeholder={
                      rangeKey
                        ? "Attach context to this selected range..."
                        : "Select a date range to unlock this field"
                    }
                    className="h-28"
                  />
                </div>

                <div className="calendar-range mt-4 rounded-2xl border border-dashed border-[color:var(--accent)]/40 p-3 text-xs">
                  <p className="calendar-strong mb-2 font-semibold">Selected Range</p>
                  <p>{describeRange(range.start, range.end)}</p>
                </div>
              </aside>

              <div
                className={[
                  "month-flip-base month-flip-panel calendar-card rounded-3xl p-4 shadow-[0_12px_28px_rgba(22,30,44,0.08)] md:p-5",
                  monthDirection > 0 ? "month-flip-forward" : "month-flip-backward",
                  flipPhase === "turning" ? "flip-turning" : "",
                ].join(" ")}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="calendar-muted text-sm font-bold">MONTH NAME</h2>
                    <h3 className="calendar-strong text-2xl font-semibold uppercase tracking-[0.16em] md:text-xl">
                      {monthYearLabel.toUpperCase()}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={timeContext.id}
                      onChange={(event) => onContextChange(event.target.value)}
                      className="calendar-input rounded-full border px-3 py-2 text-xs font-semibold"
                      aria-label="Calendar locale and timezone"
                    >
                      {TIME_CONTEXTS.map((context) => (
                        <option key={context.id} value={context.id}>
                          {context.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => goToMonth(-1)}
                      aria-label="Previous month"
                      disabled={isFlipping}
                      className="calendar-strong flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 transition hover:border-[color:var(--secondary)] hover:text-[color:var(--ink)]"
                    >
                      <span className="text-lg leading-none">&larr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={jumpToCurrentMonth}
                      disabled={isFlipping}
                      className="rounded-full bg-[color:var(--crescent)]/35 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)] transition hover:bg-[color:var(--crescent)]/55"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => goToMonth(1)}
                      aria-label="Next month"
                      disabled={isFlipping}
                      className="calendar-strong flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 transition hover:border-[color:var(--secondary)] hover:text-[color:var(--ink)]"
                    >
                      <span className="text-lg leading-none">&rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelectedRange}
                      className="calendar-strong rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-rose-400 hover:text-rose-500"
                    >
                      Delete Range
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="rounded-full bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Download Month
                    </button>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-7 gap-1">
                  {weekdayLabels.map((weekday, index) => {
                    const weekdayNumber = (timeContext.weekStartsOn + index) % 7;
                    const isWeekend = weekdayNumber === 0 || weekdayNumber === 6;
                    return (
                    <div
                      key={weekday}
                      className={[
                        "rounded-lg py-2 text-center text-xs font-semibold tracking-wider",
                        isWeekend ? "text-red-500" : "calendar-muted",
                      ].join(" ")}
                    >
                      {weekday}
                    </div>
                    );
                  })}
                </div>

                <div
                  ref={gridRef}
                  onMouseMove={onGridMouseMove}
                  onMouseLeave={onGridMouseLeave}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <motion.div
                    aria-hidden="true"
                    animate={{
                      opacity: glowState.visible ? 1 : 0,
                      x: glowState.x - 120,
                      y: glowState.y - 120,
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 24 }}
                    className="pointer-events-none absolute z-0 h-60 w-60 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
                    }}
                  />

                <div className="relative z-10 grid grid-cols-7 gap-1.5">
                  {monthDays.map((day, index) => {
                    const weekdayNumber = (timeContext.weekStartsOn + (index % 7)) % 7;
                    const isWeekendColumn = weekdayNumber === 0 || weekdayNumber === 6;
                    const isStart = isSameDay(day.date, range.start);
                    const isEnd = isSameDay(day.date, range.end);
                    const isSelected = isStart || isEnd;
                    const inRange = isBetweenInclusive(day.date, range.start, range.end);
                    const marker = HOLIDAY_HINTS[day.date.getMonth()]?.[day.date.getDate()];

                    return (
                      <button
                        type="button"
                        key={day.iso}
                        onClick={() => selectDay(day.date, day.isCurrentMonth)}
                        className={[
                          "group relative flex h-14 flex-col items-center justify-center rounded-xl border text-sm transition",
                          day.isCurrentMonth
                            ? "calendar-day-current hover:border-[color:var(--accent)]/70"
                            : "calendar-day-out",
                          day.isCurrentMonth
                            ? isWeekendColumn
                              ? "text-red-500"
                              : "calendar-strong"
                            : isWeekendColumn
                              ? "text-red-300"
                              : "calendar-soft",
                          inRange ? "border-[color:var(--secondary)]/60 bg-[color:var(--secondary)]/16" : "",
                          isSelected
                            ? isWeekendColumn
                              ? "border-red-500 bg-red-100 text-red-600 shadow-[0_8px_16px_rgba(220,38,38,0.22)]"
                              : "border-red-600 bg-red-600 text-white shadow-[0_8px_16px_rgba(220,38,38,0.35)]"
                            : "",
                          day.isToday && !isSelected ? "ring-1 ring-[color:var(--accent)]/60" : "",
                        ].join(" ")}
                      >
                        <span className="font-semibold leading-none">{day.date.getDate()}</span>
                        {marker && day.isCurrentMonth ? (
                          <span
                            title={marker}
                            className={[
                              "mt-1 h-1.5 w-1.5 rounded-full",
                              isSelected
                                ? isWeekendColumn
                                  ? "bg-red-500"
                                  : "bg-white/90"
                                : "bg-[color:var(--accent)]",
                            ].join(" ")}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function readStoredNotes(): {
  monthNotes: Record<string, string>;
  rangeNotes: Record<string, string>;
} {
  if (typeof window === "undefined") {
    return { monthNotes: {}, rangeNotes: {} };
  }

  const saved = window.localStorage.getItem(NOTES_STORAGE_KEY);
  if (!saved) {
    return { monthNotes: {}, rangeNotes: {} };
  }

  try {
    const parsed = JSON.parse(saved) as {
      monthNotes?: Record<string, string>;
      rangeNotes?: Record<string, string>;
    };
    return {
      monthNotes: parsed.monthNotes ?? {},
      rangeNotes: parsed.rangeNotes ?? {},
    };
  } catch {
    return { monthNotes: {}, rangeNotes: {} };
  }
}

function describeRange(start: Date | null, end: Date | null): string {
  if (!start && !end) {
    return "No dates selected yet.";
  }

  if (start && !end) {
    return `Start: ${friendlyDate(start)} (choose an end date).`;
  }

  if (start && end) {
    return `${friendlyDate(start)} to ${friendlyDate(end)}`;
  }

  return "No dates selected yet.";
}

function getRangeKey(start: Date | null, end: Date | null): string {
  if (!start || !end) {
    return "";
  }

  return `${toIsoDate(start)}__${toIsoDate(end)}`;
}

function friendlyDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDateForTimeZone(timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "2026");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");
  return new Date(year, month - 1, day);
}

async function extractImageTheme(imageSrc: string): Promise<MonthTheme> {
  const color = await extractDominantColor(imageSrc);
  const secondary = lightenColor(color, 28);
  const crescent = lightenColor(mixColors(color, "#ffd36b", 0.35), 22);
  const ink = darkenColor(color, 52);
  return { accent: color, secondary, crescent, ink };
}

function extractDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      const width = 56;
      const height = 56;
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);

      const { data } = context.getImageData(0, 0, width, height);
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;

      for (let index = 0; index < data.length; index += 16) {
        red += data[index];
        green += data[index + 1];
        blue += data[index + 2];
        count += 1;
      }

      const avgRed = Math.round(red / count);
      const avgGreen = Math.round(green / count);
      const avgBlue = Math.round(blue / count);
      resolve(rgbToHex(avgRed, avgGreen, avgBlue));
    };

    image.onerror = () => reject(new Error("Failed to read image color"));
  });
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

function lightenColor(hex: string, amount: number): string {
  const { red, green, blue } = parseHex(hex);
  return rgbToHex(red + amount, green + amount, blue + amount);
}

function darkenColor(hex: string, amount: number): string {
  const { red, green, blue } = parseHex(hex);
  return rgbToHex(red - amount, green - amount, blue - amount);
}

function mixColors(firstHex: string, secondHex: string, ratio: number): string {
  const first = parseHex(firstHex);
  const second = parseHex(secondHex);
  const inverse = 1 - ratio;

  return rgbToHex(
    Math.round(first.red * inverse + second.red * ratio),
    Math.round(first.green * inverse + second.green * ratio),
    Math.round(first.blue * inverse + second.blue * ratio),
  );
}

function parseHex(hex: string): { red: number; green: number; blue: number } {
  const cleaned = hex.replace("#", "");
  const red = Number.parseInt(cleaned.slice(0, 2), 16);
  const green = Number.parseInt(cleaned.slice(2, 4), 16);
  const blue = Number.parseInt(cleaned.slice(4, 6), 16);
  return { red, green, blue };
}

function hexToRgba(hex: string, alpha: number): string {
  const { red, green, blue } = parseHex(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function NoteEditor({
  value,
  onChange,
  editing,
  setEditing,
  placeholder,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  placeholder: string;
  className: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div
        className={[
          "calendar-input flex w-full items-center rounded-2xl border px-3 py-3 text-sm opacity-60",
          className,
        ].join(" ")}
      >
        {placeholder}
      </div>
    );
  }

  if (editing) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        placeholder={placeholder}
        autoFocus
        className={[
          "calendar-input w-full resize-none rounded-2xl border p-3 text-sm leading-relaxed outline-none transition focus:border-[color:var(--accent)]",
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={[
        "calendar-input markdown-preview w-full rounded-2xl border p-3 text-left text-sm leading-relaxed",
        className,
      ].join(" ")}
    >
      {value.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      ) : (
        <span className="calendar-soft">{placeholder}</span>
      )}
    </button>
  );
}
