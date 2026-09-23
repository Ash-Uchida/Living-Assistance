import type { RoomStatus } from "./types";

export const statusLabel: Record<RoomStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  needs_cleaning: "Needs cleaning",
  maintenance: "Maintenance",
};

export const statusClass: Record<RoomStatus, string> = {
  available: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  occupied: "bg-sky-50 text-sky-800 ring-sky-200",
  needs_cleaning: "bg-amber-50 text-amber-900 ring-amber-200",
  maintenance: "bg-stone-100 text-stone-700 ring-stone-200",
};

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
