/**
 * Date utility functions for meal planning calendar
 */

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}

/**
 * Get an array of 7 dates for the week containing the given date
 */
export function getWeekDates(date: Date): Date[] {
  const weekStart = getWeekStart(date);
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }

  return dates;
}

/**
 * Format a date as a short day name (e.g., "Mon", "Tue")
 */
export function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format a date as month/day (e.g., "1/15")
 */
export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

/**
 * Format a date as full display (e.g., "Mon, Jan 15")
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get the start of day timestamp (midnight) for a given date
 */
export function getStartOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Get the end of day timestamp (23:59:59.999) for a given date
 */
export function getEndOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get the previous week's start date
 */
export function getPreviousWeek(currentDate: Date): Date {
  const d = new Date(currentDate);
  d.setDate(d.getDate() - 7);
  return getWeekStart(d);
}

/**
 * Get the next week's start date
 */
export function getNextWeek(currentDate: Date): Date {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + 7);
  return getWeekStart(d);
}

/**
 * Format a week range for display (e.g., "Jan 15 - Jan 21, 2024")
 */
export function formatWeekRange(startDate: Date): string {
  const endDate = getWeekEnd(startDate);

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Format time in minutes as hours and minutes (e.g., 90 -> "1h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
