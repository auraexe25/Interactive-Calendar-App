import { addDays, format } from "date-fns";
import type { Locale } from "date-fns";

export type CalendarDay = {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const DAYS_IN_GRID = 42;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBetweenInclusive(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false;
  }

  const point = atMidday(day).getTime();
  const min = Math.min(atMidday(start).getTime(), atMidday(end).getTime());
  const max = Math.max(atMidday(start).getTime(), atMidday(end).getTime());
  return point >= min && point <= max;
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildWeekdayLabels(weekStartsOn: 0 | 1, locale: Locale): string[] {
  const baseSunday = new Date(2026, 0, 4);
  return Array.from({ length: 7 }).map((_, index) => {
    const offset = (weekStartsOn + index) % 7;
    return format(addDays(baseSunday, offset), "EEE", { locale }).toUpperCase();
  });
}

export function buildMonthGrid(
  monthDate: Date,
  options?: {
    weekStartsOn?: 0 | 1;
    todayDate?: Date;
  },
): CalendarDay[] {
  const weekStartsOn = options?.weekStartsOn ?? 1;
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekday = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstWeekday);

  const today = atMidday(options?.todayDate ?? new Date());
  const days: CalendarDay[] = [];

  for (let offset = 0; offset < DAYS_IN_GRID; offset += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + offset);

    days.push({
      date,
      iso: toIsoDate(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: isSameDay(date, today),
    });
  }

  return days;
}

function atMidday(date: Date): Date {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  return value;
}
