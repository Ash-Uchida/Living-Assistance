"use client";

import Link from "next/link";
import { useState } from "react";
import { dateKey } from "@/lib/dates";
import { CLEAN_KIND_LABEL, CLEANING_LABEL, formatClock, formatDuration } from "@/lib/format";
import { employeeName, roleHas } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { CleanJob } from "@/lib/types";
import { Badge, Card, FilterChip, PageTitle } from "@/components/ui";

type Filter = "todo" | "in_progress" | "done" | "unassigned";

export default function HousekeepingPage() {
  const store = useStore();
  const now = useNow();
  const today = dateKey(now);
  const manager = roleHas(store.access, store.role, "hk_assign");
  const [filter, setFilter] = useState<Filter>("todo");

  const relevant = store.cleanJobs.filter((job) => {
    if (!manager && job.assignedTo !== store.me?.id) return false;
    if (job.status === "done") return job.finishedAt !== null && dateKey(job.finishedAt) === today;
    return job.dueOn <= today;
  });

  const todo = relevant.filter((j) => j.status === "not_started");
  const cleaning = relevant.filter((j) => j.status === "in_progress");
  const done = relevant.filter((j) => j.status === "done");
  const unassigned = relevant.filter((j) => j.status !== "done" && !j.assignedTo);

  const visible = (
    filter === "todo"
      ? [...cleaning, ...todo]
      : filter === "in_progress"
        ? cleaning
        : filter === "done"
          ? done
          : unassigned
  ).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "deep" ? -1 : 1;
    return a.roomNumber.localeCompare(b.roomNumber);
  });

  function timeCell(job: CleanJob) {
    const target = store.cleanTargets[job.kind];
    if (job.status === "in_progress" && job.startedAt) {
      const over = now - job.startedAt > target * 60_000;
      return (
        <span className={over ? "font-semibold text-rose-700" : ""}>
          {formatClock(now - job.startedAt)} / {target} min
        </span>
      );
    }
    if (job.status === "done" && job.startedAt && job.finishedAt) {
      const over = job.finishedAt - job.startedAt > target * 60_000;
      return (
        <span className={over ? "font-semibold text-rose-700" : ""}>
          {formatDuration(job.finishedAt - job.startedAt)}
          {over ? " · over target" : ""}
        </span>
      );
    }
    return <span>Target {target} min</span>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          icon="fa-broom"
          title="Housekeeping"
          note={
            manager
              ? "Every clean due today. Routine cleans come from the weekly schedule; deep cleans come from move-outs."
              : "Your rooms for today. Open a room to start the timer and work the checklist."
          }
        />
        <div className="mb-5 flex gap-2">
          <Stat label="To do" value={todo.length} />
          <Stat label="Cleaning" value={cleaning.length} />
          <Stat label="Done" value={done.length} />
        </div>
      </div>

      {manager ? (
        <Link
          href="/housekeeping/assign"
          className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-400"
        >
          <span>
            Assignments and schedule
            {unassigned.length > 0 ? (
              <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                {unassigned.length} unassigned
              </span>
            ) : null}
          </span>
          <span className="text-xs font-medium text-teal-700">Assign rooms, deep cleans, time →</span>
        </Link>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">
            {manager ? "Today's cleans" : "My cleans today"}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "todo"} onClick={() => setFilter("todo")}>
              To do {todo.length + cleaning.length}
            </FilterChip>
            <FilterChip active={filter === "in_progress"} onClick={() => setFilter("in_progress")}>
              Cleaning {cleaning.length}
            </FilterChip>
            <FilterChip active={filter === "done"} onClick={() => setFilter("done")}>
              Done {done.length}
            </FilterChip>
            {manager ? (
              <FilterChip active={filter === "unassigned"} onClick={() => setFilter("unassigned")}>
                Unassigned {unassigned.length}
              </FilterChip>
            ) : null}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing here.</p>
        ) : (
          <ul>
            {visible.map((job, index) => (
              <li
                key={job.id}
                className={`grid grid-cols-2 items-center gap-2 px-4 py-3 sm:grid-cols-[4rem_7rem_7rem_1fr_1fr_6rem] ${
                  index < visible.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <p className="font-bold text-slate-900">{job.roomNumber}</p>
                <div>
                  <Badge tone={job.kind === "deep" ? "indigo" : "slate"}>
                    {CLEAN_KIND_LABEL[job.kind]}
                  </Badge>
                </div>
                <div>
                  <Badge
                    tone={
                      job.status === "done" ? "teal" : job.status === "in_progress" ? "amber" : "slate"
                    }
                  >
                    {CLEANING_LABEL[job.status]}
                  </Badge>
                </div>
                <p className={`text-sm ${job.assignedTo ? "text-slate-600" : "font-semibold text-rose-700"}`}>
                  {employeeName(store.employees, job.assignedTo)}
                </p>
                <p className="text-sm text-slate-600">{timeCell(job)}</p>
                <div className="text-right">
                  <Link
                    href={`/housekeeping/clean/${job.id}`}
                    className="inline-block rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
                    aria-label={`Open room ${job.roomNumber}`}
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[4.5rem] rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
