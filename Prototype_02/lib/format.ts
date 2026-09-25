import type {
  CleanKind,
  CleaningStatus,
  EventKind,
  FeedbackTopic,
  MaintenancePriority,
  MaintenanceStatus,
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

export function formatDateTime(ts: number) {
  return `${formatDay(ts)} · ${formatTime(ts)}`;
}

export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const OCCUPANCY_LABEL: Record<Occupancy, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  needs_cleaning: "Needs deep clean",
};

export const CLEANING_LABEL: Record<CleaningStatus, string> = {
  not_started: "Not started",
  in_progress: "Cleaning",
  done: "Done",
};

export const CLEAN_KIND_LABEL: Record<CleanKind, string> = {
  routine: "Routine",
  deep: "Deep clean",
};

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "Dine in",
  to_go: "To-go tray",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "New",
  preparing: "Preparing",
  ready: "Ready",
  complete: "Complete",
};

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting on parts",
  done: "Complete",
};

export const PRIORITY_LABEL: Record<MaintenancePriority, string> = {
  routine: "Routine",
  urgent: "Urgent",
};

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  activity: "Activity",
  maintenance: "Maintenance",
  dining: "Dining",
  housekeeping: "Housekeeping",
};

export const FEEDBACK_TOPIC_LABEL: Record<FeedbackTopic, string> = {
  food_temperature: "Food temperature",
  food_taste: "Food taste",
  repairs_slow: "Repairs taking long",
  room_cleanliness: "Room cleanliness",
  noise: "Noise at night",
  activity_variety: "Activity variety",
  staff_response: "Staff response",
};

/** Minutes, hours or days — whichever reads best. */
export function formatSpan(ms: number) {
  const minutes = Math.max(0, ms / 60_000);
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours < 10 ? hours.toFixed(1).replace(/\.0$/, "") : Math.round(hours)} hrs`;
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")} days`;
}
