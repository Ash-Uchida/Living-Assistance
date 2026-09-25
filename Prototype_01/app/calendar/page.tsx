"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  combineDayAndTime,
  dateKey,
  monthGrid,
  startOfDay,
  stayCoversDay,
} from "@/lib/dates";
import { EVENT_KIND_LABEL, formatDay, formatStayRange, formatTime } from "@/lib/format";
import { roleHas } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { CalendarEvent, EventKind } from "@/lib/types";
import {
  Card,
  Field,
  GhostButton,
  PageTitle,
  PrimaryButton,
  inputClass,
} from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const store = useStore();
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [picked, setPicked] = useState<Date>(() => today);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("activity");
  const [time, setTime] = useState("10:00");
  const [roomNumber, setRoomNumber] = useState("");
  const [building, setBuilding] = useState(store.buildings[0] ?? "");
  const [openAttendance, setOpenAttendance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canTakeAttendance = roleHas(store.access, store.role, "attendance");
  const residentRooms = store.rooms
    .filter((r) => r.occupancy === "occupied")
    .map((r) => r.number);

  const days = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const pickedKey = dateKey(picked);
  const dayEvents = store.events
    .filter((event) => dateKey(event.startsAt) === pickedKey)
    .sort((a, b) => a.startsAt - b.startsAt);
  const dayStays = store.stays.filter((stay) => stayCoversDay(stay, pickedKey));

  function addOnDay(event: FormEvent) {
    event.preventDefault();
    const result = store.addEvent({
      title,
      kind,
      startsAt: combineDayAndTime(picked, time),
      building: building || null,
      roomNumber: roomNumber || null,
    });
    if (result) {
      setError(result);
      return;
    }
    setTitle("");
    setRoomNumber("");
    setError(null);
  }

  const monthTitle = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle
          icon="fa-calendar-days"
          title="Activities"
          note="Click a day to see what is happening and in which building. Mark attendance by room number. No resident names."
        />
        <div className="mb-5 flex items-center gap-2">
          <GhostButton
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            ←
          </GhostButton>
          <p className="min-w-36 text-center text-sm font-bold text-slate-900">
            {monthTitle}
          </p>
          <GhostButton
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            →
          </GhostButton>
        </div>
      </div>

      <div className="grid gap-1 sm:grid-cols-7">
        {WEEKDAYS.map((day) => (
          <p
            key={day}
            className="hidden text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:block"
          >
            {day}
          </p>
        ))}
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = key === dateKey(today);
          const isPicked = key === pickedKey;
          const events = store.events.filter(
            (item) => dateKey(item.startsAt) === key,
          );
          const roomsStaying = store.stays.filter((stay) =>
            stayCoversDay(stay, key),
          ).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPicked(day);
                setError(null);
              }}
              className={`min-h-24 rounded-xl border p-2 text-left ${
                isPicked
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-200"
                  : isToday
                    ? "border-teal-200 bg-white"
                    : "border-slate-200 bg-white"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span className="text-xs font-bold text-slate-700">
                {day.getDate()}
              </span>
              <ul className="mt-1 space-y-0.5">
                {events.slice(0, 2).map((item) => (
                  <li
                    key={item.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold ${
                      item.kind === "maintenance"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-sky-100 text-sky-900"
                    }`}
                  >
                    {item.title}
                  </li>
                ))}
                {events.length > 2 ? (
                  <li className="text-[10px] text-slate-500">
                    +{events.length - 2} more
                  </li>
                ) : null}
                {roomsStaying > 0 ? (
                  <li className="text-[10px] text-slate-500">
                    {roomsStaying} {roomsStaying === 1 ? "stay" : "stays"}
                  </li>
                ) : null}
              </ul>
            </button>
          );
        })}
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {formatDay(picked)}
          </h2>
          <p className="text-xs text-slate-500">
            What is on this day. Room numbers only.
          </p>
        </div>

        {dayEvents.length === 0 && dayStays.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing on this day yet.</p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((item) => (
              <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {EVENT_KIND_LABEL[item.kind]} · {formatTime(item.startsAt)}
                      {item.building ? ` · ${item.building}` : ""}
                      {item.roomNumber ? ` · Room ${item.roomNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.kind === "activity" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAttendance((current) => (current === item.id ? null : item.id))
                        }
                        className="text-xs font-semibold text-teal-700"
                        aria-expanded={openAttendance === item.id}
                      >
                        Attendance {item.attendance.length}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setError(store.removeEvent(item.id))}
                      className="text-xs font-semibold text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {openAttendance === item.id ? (
                  <Attendance
                    event={item}
                    rooms={residentRooms}
                    editable={canTakeAttendance}
                    onToggle={(room) => store.toggleAttendance(item.id, room)}
                  />
                ) : null}
              </li>
            ))}
            {dayStays.map((stay) => (
              <li
                key={stay.id}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
              >
                Room {stay.roomNumber} · {formatStayRange(stay.startsOn, stay.endsOn)}
                {dateKey(stay.checkedInAt) === pickedKey
                  ? ` · in at ${formatTime(stay.checkedInAt)}`
                  : ""}
                {stay.checkedOutAt && dateKey(stay.checkedOutAt) === pickedKey
                  ? ` · out at ${formatTime(stay.checkedOutAt)}`
                  : ""}
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={addOnDay}
          className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2"
        >
          <Field label="What is happening">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bingo — no names"
              required
            />
          </Field>
          <Field label="Kind">
            <select
              className={inputClass}
              value={kind}
              onChange={(e) => {
                const next = e.target.value as EventKind;
                setKind(next);
                if (next === "activity" && !building) setBuilding(store.buildings[0] ?? "");
              }}
            >
              <option value="activity">Activity</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>
          <Field label="Time">
            <input
              className={inputClass}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </Field>
          <Field label={kind === "activity" ? "Building" : "Building (optional)"}>
            <select
              className={inputClass}
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            >
              {kind === "maintenance" ? <option value="">No building</option> : null}
              {store.buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room (optional)">
            <select
              className={inputClass}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            >
              <option value="">No room</option>
              {store.rooms.map((room) => (
                <option key={room.number} value={room.number}>
                  {room.number}
                </option>
              ))}
            </select>
          </Field>
          {error ? (
            <p className="text-sm text-rose-700 sm:col-span-2">{error}</p>
          ) : null}
          <PrimaryButton type="submit" className="sm:col-span-2">
            Add to {formatDay(picked)}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}

function Attendance({
  event,
  rooms,
  editable,
  onToggle,
}: {
  event: CalendarEvent;
  rooms: string[];
  editable: boolean;
  onToggle: (room: string) => void;
}) {
  const all = [...new Set([...rooms, ...event.attendance])].sort();
  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {editable ? "Tap the rooms of residents who came" : "Rooms that attended"}
      </p>
      {all.length === 0 ? (
        <p className="text-sm text-slate-600">No residents checked in.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {all.map((room) => {
            const came = event.attendance.includes(room);
            if (!editable && !came) return null;
            return (
              <button
                key={room}
                type="button"
                disabled={!editable}
                aria-pressed={came}
                aria-label={`${event.title} room ${room}`}
                onClick={() => onToggle(room)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  came ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {room}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
