import type {
  CleaningStatus,
  EventKind,
  Meal,
  Occupancy,
  OrderStatus,
  OrderType,
} from "./types";

import { parseDateKey } from "./dates";

export function formatDay(value: Date | number | string) {
  const date = typeof value === "string" ? parseDateKey(value) : new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatStayRange(startsOn: string, endsOn: string) {
  const start = parseDateKey(startsOn).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const end = parseDateKey(endsOn).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${start} – ${end}`;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

export const OCCUPANCY_LABEL: Record<Occupancy, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  needs_cleaning: "Needs cleaning",
};

export const CLEANING_LABEL: Record<CleaningStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "Dine-in",
  tray: "Tray",
  to_go: "To-go",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  served: "Served",
};

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  activity: "Activity",
  maintenance: "Maintenance",
};
