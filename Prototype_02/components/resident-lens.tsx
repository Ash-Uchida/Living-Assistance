"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { dateKey } from "@/lib/dates";
import { FEEDBACK_TOPIC_LABEL, formatDay, formatStayRange, formatTime } from "@/lib/format";
import {
  DEPARTMENT_DOT,
  needsVisit,
  roomInsights,
  roomSignals,
  roomTimeline,
} from "@/lib/insights";
import { DEPARTMENT_LABEL } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { Department, FeedbackKind, FeedbackTopic } from "@/lib/types";
import { Card, Field, GhostButton, PrimaryButton, Segmented, inputClass } from "@/components/ui";

const DEPARTMENTS: Department[] = ["housekeeping", "dining", "maintenance", "activities"];

export function ResidentLens({ room }: { room?: string }) {
  const store = useStore();
  const now = useNow(60_000);
  const [view, setView] = useState<"visit" | "all">("visit");

  const rooms = useMemo(
    () =>
      store.rooms
        .filter((r) => r.occupancy === "occupied")
        .map((r) => ({ room: r, signals: roomSignals(store, r.number, now) }))
        .sort((a, b) => b.signals.filter((s) => s.strong).length - a.signals.filter((s) => s.strong).length),
    [store, now],
  );
  const flagged = rooms.filter((r) => needsVisit(r.signals));
  const list = view === "visit" ? flagged : rooms;
  const selected = room ?? flagged[0]?.room.number ?? rooms[0]?.room.number;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[300px_1fr]">
      <section aria-label="Rooms" className={`space-y-3 ${room ? "hidden lg:block" : ""}`}>
        <h1 className="text-3xl font-semibold text-slate-900">Residents</h1>
        <p className="text-xs text-slate-500">By room number. No names or health details.</p>
        <Segmented
          label="Which rooms"
          value={view}
          onChange={setView}
          options={[
            { value: "visit", label: `Needs a visit · ${flagged.length}` },
            { value: "all", label: "Everyone" },
          ]}
        />
        {list.length === 0 ? (
          <p className="rounded-xl bg-teal-50 px-3 py-4 text-sm text-teal-900">No rooms need a visit right now.</p>
        ) : (
          <ul className="space-y-2">
            {list.map(({ room: r, signals }) => (
              <li key={r.number}>
                <Link
                  href={`/residents/${r.number}`}
                  aria-current={r.number === selected ? "page" : undefined}
                  className={`block rounded-xl border px-3 py-2.5 ${
                    r.number === selected ? "border-teal-800 bg-paper ring-1 ring-teal-800" : "border-slate-200 bg-paper hover:bg-white"
                  }`}
                >
                  <span className="flex items-baseline justify-between">
                    <span className="font-serif text-base font-semibold text-slate-900">Room {r.number}</span>
                    <span className="text-[11px] text-slate-500">{r.building}</span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {signals.length === 0 ? (
                      <span className="text-[11px] text-slate-500">Nothing flagged</span>
                    ) : (
                      signals.map((s) => (
                        <span
                          key={s.id}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            s.strong ? "bg-rose-700 text-white" : "bg-teal-100 text-teal-900"
                          }`}
                        >
                          {s.label}
                        </span>
                      ))
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <RoomDetail key={selected} room={selected} showBack={Boolean(room)} className={room ? "" : "hidden lg:block"} />
      ) : (
        <p className="text-sm text-slate-600">No rooms are checked in.</p>
      )}
    </div>
  );
}

function RoomDetail({ room, showBack, className }: { room: string; showBack: boolean; className: string }) {
  const store = useStore();
  const now = useNow(60_000);
  const [panel, setPanel] = useState<"feedback" | "visit" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const info = store.rooms.find((r) => r.number === room);
  const stay = store.stays.find((s) => s.roomNumber === room && !s.checkedOutAt);
  const insights = roomInsights(store, room, now).slice(0, 3);
  const timeline = roomTimeline(store, room, now);
  const visits = store.visits.filter((v) => v.roomNumber === room).sort((a, b) => a.on.localeCompare(b.on));

  if (!info) {
    return (
      <Card className={className}>
        <p className="text-sm text-slate-700">There is no room {room}.</p>
      </Card>
    );
  }

  return (
    <section aria-label={`Room ${room}`} className={`space-y-4 ${className}`}>
      {showBack ? (
        <Link href="/residents" className="text-xs font-semibold text-teal-700 lg:hidden">
          ← All rooms
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Room {room}</h2>
          <p className="text-xs text-slate-500">
            {info.building}
            {stay ? ` · Stay ${formatStayRange(stay.startsOn, stay.endsOn)}` : " · No one checked in"}
          </p>
        </div>
        <div className="flex gap-2">
          <GhostButton type="button" aria-expanded={panel === "feedback"} onClick={() => setPanel(panel === "feedback" ? null : "feedback")}>
            Log feedback
          </GhostButton>
          <PrimaryButton type="button" aria-expanded={panel === "visit"} onClick={() => setPanel(panel === "visit" ? null : "visit")}>
            Plan a visit
          </PrimaryButton>
        </div>
      </div>

      {panel === "feedback" ? (
        <FeedbackForm
          room={room}
          onDone={(message) => {
            setPanel(null);
            setFlash(message);
          }}
        />
      ) : null}
      {panel === "visit" ? (
        <VisitForm
          room={room}
          onDone={(message) => {
            setPanel(null);
            setFlash(message);
          }}
        />
      ) : null}
      {flash ? (
        <p role="status" className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
          {flash}
        </p>
      ) : null}

      {insights.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
                {DEPARTMENT_LABEL[insight.department]}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{insight.title}</p>
              <p className="mt-1 text-[11px] text-slate-600">{insight.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-teal-50 px-3 py-3 text-sm text-teal-900">Nothing stands out for this room this week.</p>
      )}

      {visits.length ? (
        <Card className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">Planned visits</h3>
          <ul className="space-y-1.5">
            {visits.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                <span className={v.doneAt ? "text-slate-400 line-through" : "text-slate-800"}>
                  {formatDay(v.on)} · {v.reason}
                </span>
                <button
                  type="button"
                  onClick={() => store.finishVisit(v.id)}
                  className="text-xs font-semibold text-teal-700"
                >
                  {v.doneAt ? "Undo" : "Mark done"}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">This week, across every department</h3>
          <span className="flex flex-wrap gap-3 text-[10px] text-slate-500">
            {DEPARTMENTS.map((d) => (
              <span key={d} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${DEPARTMENT_DOT[d]}`} />
                {DEPARTMENT_LABEL[d]}
              </span>
            ))}
          </span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing recorded this week.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {timeline.map((entry) => (
              <li key={entry.id} className="grid grid-cols-[88px_12px_1fr_auto] items-center gap-2 py-2 text-xs">
                <span className="font-semibold text-slate-500">
                  {new Date(entry.at).toLocaleDateString(undefined, { weekday: "short" })} {formatTime(entry.at)}
                </span>
                <span className={`h-2 w-2 rounded-full ${DEPARTMENT_DOT[entry.department]}`} />
                <span className="text-slate-800">{entry.text}</span>
                {entry.tag ? (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      entry.tag === "Compliment" ? "bg-teal-100 text-teal-900" : "bg-rose-700 text-white"
                    }`}
                  >
                    {entry.tag}
                  </span>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function FeedbackForm({ room, onDone }: { room: string; onDone: (message: string) => void }) {
  const store = useStore();
  const [department, setDepartment] = useState<Department>("dining");
  const [kind, setKind] = useState<FeedbackKind>("complaint");
  const [topic, setTopic] = useState<FeedbackTopic>("food_temperature");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.addRoomFeedback({ roomNumber: room, department, kind, topic, text });
    if (result) {
      setError(result);
      return;
    }
    onDone(`Feedback logged for room ${room}.`);
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Department">
          <select className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {DEPARTMENT_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kind of feedback">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as FeedbackKind)}>
            <option value="complaint">Complaint</option>
            <option value="compliment">Compliment</option>
          </select>
        </Field>
        <Field label="Topic">
          <select className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value as FeedbackTopic)}>
            {(Object.keys(FEEDBACK_TOPIC_LABEL) as FeedbackTopic[]).map((t) => (
              <option key={t} value={t}>
                {FEEDBACK_TOPIC_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="What they said">
          <input
            className={inputClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Their words. No names or health details."
          />
        </Field>
        {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <PrimaryButton type="submit">Save feedback</PrimaryButton>
          <GhostButton type="button" onClick={() => onDone("Nothing logged.")}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Card>
  );
}

function VisitForm({ room, onDone }: { room: string; onDone: (message: string) => void }) {
  const store = useStore();
  const [on, setOn] = useState(() => dateKey(Date.now()));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.planVisit(room, on, reason);
    if (result) {
      setError(result);
      return;
    }
    onDone(`Visit to room ${room} planned for ${formatDay(on)}.`);
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Day">
          <input className={inputClass} type="date" value={on} onChange={(e) => setOn(e.target.value)} />
        </Field>
        <Field label="Why you are visiting">
          <input
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ask how meals are going"
          />
        </Field>
        {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <PrimaryButton type="submit">Save visit</PrimaryButton>
          <GhostButton type="button" onClick={() => onDone("No visit planned.")}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Card>
  );
}
