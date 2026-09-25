export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(value: Date | number | string) {
  const d = typeof value === "number" || typeof value === "string"
    ? new Date(value)
    : value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(value: Date | number) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(value: Date, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export function combineDayAndTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = startOfDay(day);
  next.setHours(Number.isFinite(hours) ? hours : 12, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next.getTime();
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function stayLastDay(stay: {
  endsOn: string;
  checkedOutAt: number | null;
}) {
  if (!stay.checkedOutAt) return stay.endsOn;
  const out = dateKey(stay.checkedOutAt);
  return out < stay.endsOn ? out : stay.endsOn;
}

export function stayCoversDay(
  stay: { startsOn: string; endsOn: string; checkedOutAt: number | null },
  day: Date | string,
) {
  const key = typeof day === "string" && isDateKey(day) ? day : dateKey(day);
  return key >= stay.startsOn && key <= stayLastDay(stay);
}
