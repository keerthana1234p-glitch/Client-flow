export const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Returns current Date in IST
 */
export function getNowIST(): Date {
  return new Date();
}

/**
 * Formats a Date or ISO string into readable IST string: "DD MMM YYYY, hh:mm A IST"
 */
export function formatISTDateTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formatted = new Intl.DateTimeFormat('en-IN', options).format(date);
  return `${formatted} IST`;
}

/**
 * Formats a Date or ISO string into "DD MMM YYYY" in IST
 */
export function formatISTDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Checks if a given timestamp is overdue relative to now in IST
 */
export function isOverdueIST(dueAtInput: Date | string): boolean {
  const dueDate = typeof dueAtInput === 'string' ? new Date(dueAtInput) : dueAtInput;
  return dueDate.getTime() < Date.now();
}

/**
 * Checks if a given timestamp is scheduled for today in IST
 */
export function isTodayIST(dueAtInput: Date | string): boolean {
  const date = typeof dueAtInput === 'string' ? new Date(dueAtInput) : dueAtInput;
  const now = new Date();

  const toISTDateString = (d: Date) =>
    new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_IST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  return toISTDateString(date) === toISTDateString(now);
}

/**
 * Calculates days difference in IST
 */
export function getDaysDifferenceIST(pastDateInput: Date | string): number {
  const pastDate = typeof pastDateInput === 'string' ? new Date(pastDateInput) : pastDateInput;
  const diffMs = Date.now() - pastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
