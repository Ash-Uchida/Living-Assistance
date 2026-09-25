"use client";

import Link from "next/link";
import { useState } from "react";
import { addDays, dateKey } from "@/lib/dates";
import { CLEAN_KIND_LABEL, CLEANING_LABEL, formatDay, formatDuration } from "@/lib/format";
import { WEEKDAY_SHORT, employeeName } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useBase } from "@/lib/surface";
import { Badge, Card, PageTitle, inputClass } from "@/components/ui";

export default function AssignPage() {
  const store = useStore();
  const base = useBase();
  const [message, setMessage] = useState<string | null>(null);
  const housekeepers = store.employees.filter((e) => e.role === "housekeeper");
  const deepCleans = store.cleanJobs
    .filter((j) => j.kind === "deep" && j.status !== "done")
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

  const weekAgo = dateKey(addDays(new Date(), -7));
  const finished = store.cleanJobs
    .filter((j) => j.status === "done" && j.startedAt && j.finishedAt && j.dueOn >= weekAgo)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  const minutesOf = (j: (typeof finished)[number]) =>
    ((j.finishedAt ?? 0) - (j.startedAt ?? 0)) / 60_000;

  const byPerson = housekeepers.map((person) => {
    const mine = finished.filter((j) => j.assignedTo === person.id);
    const over = mine.filter((j) => minutesOf(j) > store.cleanTargets[j.kind]).length;
    const avg = mine.length
      ? Math.round(mine.reduce((sum, j) => sum + minutesOf(j), 0) / mine.length)
      : null;
    return { person, count: mine.length, over, avg };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href={`${base}/housekeeping`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
      >
        <i className="fas fa-arrow-left" aria-hidden />
        Back to housekeeping
      </Link>
      <PageTitle
        icon="fa-clipboard-list"
        title="Assignments and schedule"
        note="Deep cleans from move-outs, who owns each room, which days routine cleans repeat, and how long cleans take."
      />
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}

      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Deep cleans</h2>
        {deepCleans.length === 0 ? (
          <p className="text-sm text-slate-600">No deep cleans waiting.</p>
        ) : (
          <ul className="space-y-2">
            {deepCleans.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-900">Room {job.roomNumber}</p>
                  <Badge tone={job.status === "in_progress" ? "amber" : "slate"}>
                    {CLEANING_LABEL[job.status]}
                  </Badge>
                  {!job.assignedTo ? <Badge tone="rose">Needs someone</Badge> : null}
                </div>
                <select
                  className={`${inputClass} max-w-[14rem]`}
                  value={job.assignedTo ?? ""}
                  onChange={(e) => setMessage(store.assignJob(job.id, e.target.value || null))}
                  aria-label={`Deep clean for room ${job.roomNumber}`}
                  disabled={job.status === "in_progress"}
                >
                  <option value="">Unassigned</option>
                  {housekeepers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.email.split("@")[0]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Rooms and routine schedule</h2>
          <p className="text-xs text-slate-500">
            Routine cleans repeat every week on the days picked, while the room is occupied.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-bold">Room</th>
              <th className="px-4 py-2 font-bold">Housekeeper</th>
              <th className="px-4 py-2 font-bold">Repeats on</th>
            </tr>
          </thead>
          <tbody>
            {store.rooms.map((room) => (
              <tr key={room.number} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 font-bold text-slate-900">{room.number}</td>
                <td className="px-4 py-2.5">
                  <select
                    className={`${inputClass} max-w-[12rem] py-1.5`}
                    value={room.assignedTo ?? ""}
                    onChange={(e) => store.setRoomAssignee(room.number, e.target.value || null)}
                    aria-label={`Housekeeper for room ${room.number}`}
                  >
                    <option value="">Unassigned</option>
                    {housekeepers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.email.split("@")[0]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAY_SHORT.map((label, weekday) => {
                      const on = room.cleanDays.includes(weekday);
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={on}
                          aria-label={`Room ${room.number} ${label}`}
                          onClick={() => store.toggleCleanDay(room.number, weekday)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                            on ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Time compliance (last 7 days)</h2>
          <p className="text-xs text-slate-500">
            Targets: routine {store.cleanTargets.routine} min, deep clean{" "}
            {store.cleanTargets.deep} min.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {byPerson.map(({ person, count, over, avg }) => (
            <div key={person.id} className="rounded-xl border border-slate-200 px-3 py-3">
              <p className="font-semibold text-slate-900">{person.email.split("@")[0]}</p>
              <p className="text-xs text-slate-500">
                {count} {count === 1 ? "clean" : "cleans"}
                {avg !== null ? ` · avg ${avg} min` : ""}
              </p>
              <p className={`mt-1 text-xs font-semibold ${over ? "text-rose-700" : "text-teal-700"}`}>
                {over ? `${over} over target` : "All on target"}
              </p>
            </div>
          ))}
        </div>
        {finished.length > 0 ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {finished.map((job) => {
              const mins = minutesOf(job);
              const late = mins > store.cleanTargets[job.kind];
              return (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-slate-800">
                    Room {job.roomNumber} · {CLEAN_KIND_LABEL[job.kind]} ·{" "}
                    {employeeName(store.employees, job.assignedTo)}
                  </span>
                  <span className={late ? "font-semibold text-rose-700" : "text-slate-600"}>
                    {formatDay(job.dueOn)} · {formatDuration(mins * 60_000)}
                    {late ? " (over)" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
