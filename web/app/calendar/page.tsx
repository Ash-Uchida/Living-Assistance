"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  dateKey,
  fromDateInput,
  monthGrid,
  startOfDay,
  stayCoversDay,
  stayRange,
  rangesOverlap,
} from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { useStore } from "@/lib/store";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Mode = "stay" | "maint";

export default function CalendarPage() {
  const { rooms, stays, ready, scheduleStay, setMaintenanceDue } = useStore();
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [showStay, setShowStay] = useState(true);
  const [showMaint, setShowMaint] = useState(true);
  const [picked, setPicked] = useState<Date | null>(null);
  const [mode, setMode] = useState<Mode>("stay");
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [leaveOn, setLeaveOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const openStays = stays.filter((s) => !s.checkedOutAt);

  const freeRooms = useMemo(() => {
    if (!picked) return rooms;
    const start = startOfDay(picked);
    const end = leaveOn ? startOfDay(fromDateInput(leaveOn)) : addDays(start, 7);
    return rooms.filter((r) => {
      if (r.status === "maintenance" && start.getTime() <= today.getTime()) {
        return false;
      }
      return !openStays.some((s) => {
        if (s.room !== r.number) return false;
        const range = stayRange(s);
        return rangesOverlap(start, end, range.start, range.end);
      });
    });
  }, [picked, leaveOn, rooms, openStays, today]);

  function openDay(day: Date) {
    setPicked(day);
    setMode("stay");
    setName("");
    setRoom("");
    setLeaveOn(dateKey(addDays(day, 7)));
    setError(null);
  }

  function onAddStay(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) return;
    const message = scheduleStay(
      name,
      room,
      fromDateInput(dateKey(picked)),
      fromDateInput(leaveOn),
    );
    if (message) {
      setError(message);
      return;
    }
    setPicked(null);
  }

  function onAddMaint(e: React.FormEvent) {
    e.preventDefault();
    if (!picked || !room) {
      setError("Choose a room.");
      return;
    }
    const message = setMaintenanceDue(room, fromDateInput(dateKey(picked)));
    if (message) {
      setError(message);
      return;
    }
    setPicked(null);
  }

  if (!ready) return <p className="text-stone-500">Loading…</p>;

  const title = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-stone-600">
            Click a day to add someone or a maintenance request. Click a chip
            to open that room.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            className="rounded-lg bg-white px-2.5 py-1 text-sm ring-1 ring-stone-300 hover:bg-stone-50"
          >
            ←
          </button>
          <div className="min-w-36 text-center text-sm font-medium">{title}</div>
          <button
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            className="rounded-lg bg-white px-2.5 py-1 text-sm ring-1 ring-stone-300 hover:bg-stone-50"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowStay((v) => !v)}
          className={`rounded-full px-2.5 py-1 ring-1 ${
            showStay
              ? "bg-sky-50 text-sky-800 ring-sky-200"
              : "bg-white text-stone-500 ring-stone-300"
          }`}
        >
          Occupancy
        </button>
        <button
          type="button"
          onClick={() => setShowMaint((v) => !v)}
          className={`rounded-full px-2.5 py-1 ring-1 ${
            showMaint
              ? "bg-stone-100 text-stone-700 ring-stone-300"
              : "bg-white text-stone-500 ring-stone-300"
          }`}
        >
          Maintenance due
        </button>
      </div>

      {picked ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Add on
              </div>
              <div className="text-lg font-medium">
                {formatDay(picked.toISOString())}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-sm text-stone-500 underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("stay");
                setError(null);
                setRoom("");
              }}
              className={`rounded-full px-3 py-1 text-sm ring-1 ${
                mode === "stay"
                  ? "bg-stone-900 text-white ring-stone-900"
                  : "bg-white text-stone-600 ring-stone-300"
              }`}
            >
              Someone in a room
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("maint");
                setError(null);
                setRoom("");
              }}
              className={`rounded-full px-3 py-1 text-sm ring-1 ${
                mode === "maint"
                  ? "bg-stone-900 text-white ring-stone-900"
                  : "bg-white text-stone-600 ring-stone-300"
              }`}
            >
              Maintenance request
            </button>
          </div>

          {mode === "stay" ? (
            <form onSubmit={onAddStay} className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1 text-sm">
                <span className="text-stone-600">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-stone-600">Room</span>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
                  required
                >
                  <option value="">Open rooms those days</option>
                  {freeRooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      {r.number}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-stone-600">Leave on</span>
                <input
                  type="date"
                  value={leaveOn}
                  onChange={(e) => setLeaveOn(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
                  required
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 sm:col-span-3"
              >
                Add stay
              </button>
            </form>
          ) : (
            <form onSubmit={onAddMaint} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="text-stone-600">Room</span>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
                  required
                >
                  <option value="">Choose a room</option>
                  {rooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      {r.number}
                      {r.status === "occupied" ? " (occupied)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-xl bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 sm:col-span-2"
              >
                Add maintenance due this day
              </button>
            </form>
          )}
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
        <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50 text-center text-xs uppercase tracking-wide text-stone-500">
          {weekdays.map((d) => (
            <div key={d} className="px-1 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = key === dateKey(today);
            const selected = picked ? dateKey(picked) === key : false;
            const occupying = showStay
              ? openStays.filter((s) => stayCoversDay(s, day))
              : [];
            const due = showMaint
              ? rooms.filter(
                  (r) =>
                    r.maintenanceDueAt && dateKey(r.maintenanceDueAt) === key,
                )
              : [];

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => openDay(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDay(day);
                  }
                }}
                className={`flex min-h-28 cursor-pointer flex-col border-t border-r border-stone-100 p-1.5 ${
                  selected
                    ? "bg-amber-50"
                    : inMonth
                      ? "bg-white hover:bg-stone-50"
                      : "bg-stone-50/70 hover:bg-stone-100/80"
                }`}
              >
                <div
                  className={`mb-1 text-xs ${
                    isToday
                      ? "font-medium text-stone-900"
                      : inMonth
                        ? "text-stone-700"
                        : "text-stone-400"
                  }`}
                >
                  <span
                    className={
                      isToday
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white"
                        : ""
                    }
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {occupying.map((s) => (
                    <Link
                      key={s.id}
                      href={`/rooms/${s.room}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-900 ring-1 ring-sky-100 hover:bg-sky-100"
                      title={`${s.name} · Room ${s.room}`}
                    >
                      {s.room} {s.name}
                    </Link>
                  ))}
                  {due.map((r) => (
                    <Link
                      key={r.number}
                      href={`/rooms/${r.number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-800 ring-1 ring-stone-200 hover:bg-stone-200"
                      title={`Room ${r.number} maintenance due`}
                    >
                      {r.number} maint. due
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
