"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { addDays, combineDayAndTime, dateKey, isDateKey, parseDateKey, stayCoversDay } from "@/lib/dates";
import { formatDay, formatTime } from "@/lib/format";
import {
  DEPARTMENT_CHIP,
  DEPARTMENT_DOT,
  dayItems,
  dayRisks,
  riskBadge,
  weekStart,
} from "@/lib/insights";
import type { DayItem } from "@/lib/insights";
import { DEPARTMENT_LABEL, roleHas } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { CalendarEvent, Department, EventKind } from "@/lib/types";
import { Card, Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";

const DEPARTMENTS: Department[] = ["housekeeping", "dining", "maintenance", "activities"];

const KIND_FOR: Record<Department, EventKind> = {
  housekeeping: "housekeeping",
  dining: "dining",
  maintenance: "maintenance",
  activities: "activity",
};

function weekTitle(start: Date) {
  const end = addDays(start, 6);
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: "long" });
  if (start.getMonth() === end.getMonth()) return `${month(start)} ${start.getDate()}–${end.getDate()}`;
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function shortTime(ts: number) {
  return formatTime(ts).replace(/\s?[AP]M$/i, "");
}

export default function CalendarPage() {
  const params = useSearchParams();
  return <WeekCalendar key={params.toString()} />;
}

function WeekCalendar() {
  const store = useStore();
  const now = useNow(60_000);
  const params = useSearchParams();
  const todayKey = dateKey(now);
  const initialDay = params.get("day");
  const initialDept = params.get("dept") as Department | null;
  const [picked, setPicked] = useState(() =>
    initialDay && isDateKey(initialDay) ? initialDay : todayKey,
  );
  const [start, setStart] = useState(() => weekStart(parseDateKey(picked)));
  const [shown, setShown] = useState<Department[]>(() =>
    initialDept && DEPARTMENTS.includes(initialDept) ? [initialDept] : DEPARTMENTS,
  );
  const [openAttendance, setOpenAttendance] = useState<string | null>(params.get("event"));
  const [adding, setAdding] = useState(false);
  const canTakeAttendance = roleHas(store.access, store.role, "attendance");
  const canStaff = roleHas(store.access, store.role, "pulse");

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i))), [start]);
  const itemsByDay = useMemo(
    () => Object.fromEntries(days.map((key) => [key, dayItems(store, key)])) as Record<string, DayItem[]>,
    [days, store],
  );
  const risksByDay = useMemo(
    () => Object.fromEntries(days.map((key) => [key, dayRisks(store, key, now)])),
    [days, store, now],
  );
  const pickedItems = (itemsByDay[picked] ?? dayItems(store, picked)).filter((i) => shown.includes(i.department));
  const pickedRisks = risksByDay[picked] ?? dayRisks(store, picked, now);
  const staffing = store.staffing.filter((s) => s.on === picked);
  const feedback = store.roomFeedback.filter((f) => dateKey(f.at) === picked).sort((a, b) => b.at - a.at);
  const occupiedThatDay = store.stays.filter((s) => stayCoversDay(s, picked)).length;
  const residentRooms = store.rooms.filter((r) => r.occupancy === "occupied").map((r) => r.number);

  function pick(key: string) {
    setPicked(key);
    setOpenAttendance(null);
  }

  function moveWeek(weeks: number) {
    const next = addDays(start, weeks * 7);
    setStart(next);
    pick(dateKey(next));
  }

  function toggleDept(d: Department) {
    setShown((current) => (current.includes(d) ? current.filter((x) => x !== d) : [...current, d]));
  }

  const pickedLabel = parseDateKey(picked).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => moveWeek(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-paper"
          >
            <i className="fas fa-chevron-left text-xs" aria-hidden />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{weekTitle(start)}</h1>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => moveWeek(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-paper"
          >
            <i className="fas fa-chevron-right text-xs" aria-hidden />
          </button>
        </div>
        <PrimaryButton type="button" onClick={() => setAdding((open) => !open)} aria-expanded={adding}>
          + Add to calendar
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Show:</span>
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={shown.includes(d)}
            onClick={() => toggleDept(d)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${
              shown.includes(d) ? "border-slate-700 bg-paper text-slate-900" : "border-slate-200 text-slate-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${DEPARTMENT_DOT[d]}`} />
            {DEPARTMENT_LABEL[d]}
          </button>
        ))}
      </div>

      {adding ? <AddForm day={picked} onDone={() => setAdding(false)} /> : null}

      {/* Phone: a week strip. */}
      <div className="grid grid-cols-7 gap-1 md:hidden">
        {days.map((key) => {
          const d = parseDateKey(key);
          const badge = riskBadge(risksByDay[key] ?? []);
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-pressed={key === picked}
              className={`flex flex-col items-center rounded-lg py-1.5 text-xs ${
                key === picked ? "bg-teal-900 text-white" : "text-slate-700"
              }`}
            >
              <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className="font-serif text-base font-semibold">{d.getDate()}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${badge ? "bg-rose-500" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      {/* Computer: the whole week. */}
      <div className="hidden grid-cols-7 gap-2 md:grid">
        {days.map((key) => {
          const d = parseDateKey(key);
          const items = (itemsByDay[key] ?? []).filter((i) => shown.includes(i.department));
          const badge = riskBadge(risksByDay[key] ?? []);
          const isPicked = key === picked;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-pressed={isPicked}
              aria-label={`${formatDay(key)}${badge ? `, ${badge}` : ""}`}
              className={`flex min-h-64 flex-col gap-1.5 rounded-xl border p-2 text-left ${
                isPicked ? "border-teal-800 bg-paper ring-1 ring-teal-800" : "border-slate-200 bg-paper/70 hover:bg-paper"
              }`}
            >
              <span className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="font-serif text-lg font-semibold text-slate-900">{d.getDate()}</span>
                {key === todayKey ? (
                  <span className="rounded bg-teal-900 px-1.5 text-[9px] font-bold text-white">Today</span>
                ) : null}
              </span>
              {badge ? (
                <span className="flex items-center gap-1 rounded bg-rose-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <i className="fas fa-triangle-exclamation" aria-hidden />
                  {badge}
                </span>
              ) : null}
              {items.slice(0, 6).map((item) => (
                <span key={item.id} className={`rounded-md px-1.5 py-1 text-[10px] leading-tight ${DEPARTMENT_CHIP[item.department]}`}>
                  <span className="flex items-center gap-1 font-bold">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DEPARTMENT_DOT[item.department]}`} />
                    {item.time ? shortTime(item.time) : "All day"}
                  </span>
                  <span className="block">{item.title}</span>
                  {item.sub ? <span className="block text-[9px] opacity-70">{item.sub}</span> : null}
                </span>
              ))}
              {items.length > 6 ? <span className="text-[10px] text-slate-500">+{items.length - 6} more</span> : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Card className="order-2 space-y-3 lg:order-1">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{formatDay(picked)}</h2>
            <span className="text-[11px] text-slate-500">{occupiedThatDay} rooms occupied</span>
          </div>
          {pickedItems.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing on this day for the departments shown.</p>
          ) : (
            <ul className="space-y-2">
              {pickedItems.map((item) => {
                const event = item.eventId ? store.events.find((e) => e.id === item.eventId) : undefined;
                return (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">
                          {item.time ? formatTime(item.time) : "All day"}
                        </span>
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <span className={`h-2 w-2 rounded-full ${DEPARTMENT_DOT[item.department]}`} />
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {DEPARTMENT_LABEL[item.department]}
                            {item.sub ? ` · ${item.sub}` : ""}
                          </p>
                        </div>
                      </div>
                      {event ? (
                        <div className="flex shrink-0 items-center gap-3">
                          {event.kind === "activity" ? (
                            <button
                              type="button"
                              onClick={() => setOpenAttendance((c) => (c === event.id ? null : event.id))}
                              className="text-xs font-semibold text-teal-700"
                              aria-expanded={openAttendance === event.id}
                            >
                              Attendance {event.attendance.length}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => store.removeEvent(event.id)}
                            className="text-xs font-semibold text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {event && openAttendance === event.id ? (
                      <Attendance
                        event={event}
                        rooms={residentRooms}
                        editable={canTakeAttendance}
                        onToggle={(room) => store.toggleAttendance(event.id, room)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="order-1 space-y-3 lg:order-2">
          <h2 className="text-lg font-semibold text-slate-900">{pickedLabel}: what could go wrong</h2>
          {pickedRisks.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing flagged for this day.</p>
          ) : (
            <ul className="space-y-2">
              {pickedRisks.map((risk) => (
                <li key={risk.id} className="flex gap-2 text-sm text-slate-800">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DEPARTMENT_DOT[risk.department]}`} />
                  {risk.text}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Resident feedback that day</h3>
            {feedback.length === 0 ? (
              <p className="text-xs text-slate-500">Nothing logged.</p>
            ) : (
              <ul className="space-y-1.5">
                {feedback.map((f) => (
                  <li key={f.id} className="text-xs text-slate-700">
                    <span className="font-semibold">Room {f.roomNumber}</span> ·{" "}
                    {f.kind === "complaint" ? "Complaint" : "Compliment"}: “{f.text}”
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="order-3 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Staffing</h2>
          {staffing.length === 0 ? (
            <p className="text-sm text-slate-600">No schedule entered for this day.</p>
          ) : (
            <ul className="space-y-2">
              {DEPARTMENTS.map((d) => {
                const s = staffing.find((x) => x.department === d);
                if (!s) return null;
                const gap = s.needed - s.scheduled;
                return (
                  <li key={d} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className={`h-2 w-2 rounded-full ${DEPARTMENT_DOT[d]}`} />
                      {DEPARTMENT_LABEL[d]}
                    </span>
                    <span className="flex items-center gap-2">
                      {canStaff ? (
                        <button
                          type="button"
                          aria-label={`Fewer ${DEPARTMENT_LABEL[d].toLowerCase()} staff`}
                          onClick={() => store.setScheduled(picked, d, s.scheduled - 1)}
                          className="h-6 w-6 rounded bg-slate-100 text-xs font-bold"
                        >
                          −
                        </button>
                      ) : null}
                      <span className={`text-xs font-semibold ${gap > 0 ? "text-rose-700" : "text-slate-800"}`}>
                        {s.scheduled} of {s.needed} scheduled{gap > 0 ? ` · short ${gap}` : ""}
                      </span>
                      {canStaff ? (
                        <button
                          type="button"
                          aria-label={`More ${DEPARTMENT_LABEL[d].toLowerCase()} staff`}
                          onClick={() => store.setScheduled(picked, d, s.scheduled + 1)}
                          className="h-6 w-6 rounded bg-slate-100 text-xs font-bold"
                        >
                          +
                        </button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[11px] text-slate-500">Counts only. No staff schedules or names are stored here.</p>
        </Card>
      </div>
    </div>
  );
}

function AddForm({ day, onDone }: { day: string; onDone: () => void }) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<Department>("activities");
  const [time, setTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [building, setBuilding] = useState(store.buildings[0] ?? "");
  const [place, setPlace] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const kind = KIND_FOR[department];

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.addEvent({
      title,
      kind,
      startsAt: combineDayAndTime(parseDateKey(day), allDay ? "00:00" : time),
      allDay,
      building: building || null,
      place,
      roomNumber: roomNumber || null,
    });
    if (result) {
      setError(result);
      return;
    }
    onDone();
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <Field label="What is happening">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bingo — no names"
            required
          />
        </Field>
        <Field label="Department">
          <select
            className={inputClass}
            value={department}
            onChange={(e) => {
              const next = e.target.value as Department;
              setDepartment(next);
              if (next === "activities" && !building) setBuilding(store.buildings[0] ?? "");
            }}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {DEPARTMENT_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time">
          <input
            className={inputClass}
            type="time"
            value={time}
            disabled={allDay}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label={kind === "activity" ? "Building" : "Building (optional)"}>
          <select className={inputClass} value={building} onChange={(e) => setBuilding(e.target.value)}>
            {kind !== "activity" ? <option value="">No building</option> : null}
            {store.buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Place (optional)">
          <input
            className={inputClass}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Dining room, lobby…"
          />
        </Field>
        <Field label="Room (optional)">
          <select className={inputClass} value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}>
            <option value="">No room</option>
            {store.rooms.map((room) => (
              <option key={room.number} value={room.number}>
                {room.number}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          All day
        </label>
        {error ? <p className="text-sm text-rose-700 sm:col-span-3">{error}</p> : null}
        <div className="flex gap-2 sm:col-span-3">
          <PrimaryButton type="submit">Add to {formatDay(day)}</PrimaryButton>
          <GhostButton type="button" onClick={onDone}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Card>
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
                  came ? "bg-teal-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
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
