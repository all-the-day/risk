import { format, startOfWeek, parseISO, addDays } from "date-fns";

// 周 = 周日 → 周六，周键一律用「该周周日的日期」（yyyy-MM-dd）
// 注意：不要用 ISO 周号（周一起算），跨年周会错位；一律用日期字符串比较。
const WEEK_OPTS = { weekStartsOn: 0 } as const;

export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getWeekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, WEEK_OPTS), "yyyy-MM-dd");
}

export function getCurrentWeekStart(): string {
  return getWeekStart(new Date());
}

// 由某个日期（yyyy-MM-dd）求它所属周的周键
export function getWeekStartOf(date: string): string {
  return getWeekStart(parseISO(date));
}

export function getWeekEnd(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 6), "yyyy-MM-dd");
}

export function addWeeks(weekStart: string, n: number): string {
  return format(addDays(parseISO(weekStart), n * 7), "yyyy-MM-dd");
}

// 最近 count 周，升序，末位为本周
export function getRecentWeeks(count = 8): string[] {
  const current = getCurrentWeekStart();
  const weeks: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weeks.push(addWeeks(current, -i));
  }
  return weeks;
}

export function isFutureWeek(weekStart: string): boolean {
  return weekStart > getCurrentWeekStart();
}

// 校验是否为合法周键（yyyy-MM-dd 且落在周日）
export function isValidWeekStart(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return false;
  return getWeekStart(date) === value;
}

export function formatWeekLabel(weekStart: string): string {
  const end = parseISO(getWeekEnd(weekStart));
  return `${format(parseISO(weekStart), "M月d日")} – ${format(end, "M月d日")}`;
}

export function formatWeekChip(weekStart: string): string {
  return format(parseISO(weekStart), "M/d");
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "M月d日");
}
