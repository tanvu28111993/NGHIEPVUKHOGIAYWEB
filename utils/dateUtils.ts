export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const daysDiff = (a: Date, b: Date): number => Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export function getNextWeekday(fromDate: Date, weekdayTarget: number): Date {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  const diff = (weekdayTarget - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  // If today is the target day (diff=0) but we usually mean 'next', logic depends on usage.
  // The original script logic: if d < fromDate (not possible with +diff unless negative logic), add 7.
  // Actually, if diff is 0, it means today is the day. If we strictly want 'future', we might need logic.
  // The original script had: if (d.getTime() < fromDate.getTime()) d.setDate(d.getDate() + 7);
  // Since we setHours(0,0,0,0), d could be 'less' than fromDate if fromDate has hours.
  // Let's mimic original behavior closely.
  if (d.getTime() < fromDate.getTime()) {
      d.setDate(d.getDate() + 7);
  }
  return d;
}

export function getLastFridayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month + 1, 0); // Last day of month
  while (d.getDay() !== 5) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getLastFridayOfQuarter(year: number, quarter: number): Date {
  // Quarter 1: Jan, Feb, Mar (months 0, 1, 2). End month index = 2.
  // Quarter q: End month index = q * 3 - 1.
  return getLastFridayOfMonth(year, quarter * 3 - 1);
}

export const formatDateDDMM = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;