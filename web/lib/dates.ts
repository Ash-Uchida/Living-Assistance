export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(value: Date, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateInput(value: string) {
  return dateKey(value);
}

export function fromDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
  return date.toISOString();
}

export function daysFromNow(days: number, hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

export function stayRange(stay: {
  checkedInAt: string;
  expectedOutAt: string | null;
  checkedOutAt: string | null;
}) {
  const start = startOfDay(stay.checkedInAt);
  const endSource = stay.checkedOutAt ?? stay.expectedOutAt;
  const end = endSource ? startOfDay(endSource) : addDays(start, 7);
  return { start, end };
}

export function stayCoversDay(
  stay: {
    checkedInAt: string;
    expectedOutAt: string | null;
    checkedOutAt: string | null;
  },
  day: Date,
) {
  const { start, end } = stayRange(stay);
  const t = startOfDay(day).getTime();
  return t >= start.getTime() && t < end.getTime();
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
