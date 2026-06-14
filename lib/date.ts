import { format, getISOWeek, getYear, startOfWeek } from "date-fns";

export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getWeekString(date: Date = new Date()): string {
  const year = getYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function formatWeekLabel(weekStr: string): string {
  const [year, week] = weekStr.split("-W");
  // Calculate approximate date for the week
  const jan1 = new Date(parseInt(year), 0, 1);
  const days = (parseInt(week) - 1) * 7;
  const mon = new Date(jan1.getTime() + days * 86400000);
  // Adjust to Monday
  const day = mon.getDay();
  const diff = mon.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(mon.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${format(monday, "M月d日")} - ${format(sunday, "M月d日")}`;
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "M月d日");
}
