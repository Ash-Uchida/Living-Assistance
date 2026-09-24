"use client";

import { useState } from "react";
import { formatDuration, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { CleaningStatus, Occupancy } from "@/lib/types";
import {
  Badge,
  Card,
  FilterChip,
  GhostButton,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

type Filter = "todo" | "needs_clean" | "in_progress" | "done";

function onBoard(occupancy: Occupancy, status: CleaningStatus) {
  if (occupancy === "needs_cleaning") return true;
  if (status === "in_progress") return true;
  if (status === "done" && occupancy === "vacant") return true;
  return false;
}

function statusLabel(occupancy: Occupancy, status: CleaningStatus) {
  if (status === "in_progress") return "Cleaning";
  if (status === "done") return "Done";
  if (occupancy === "needs_cleaning") return "Needs clean";
  return "—";
}

function statusTone(
  occupancy: Occupancy,
  status: CleaningStatus,
): "slate" | "amber" | "teal" {
  if (status === "in_progress") return "amber";
  if (status === "done") return "teal";
  if (occupancy === "needs_cleaning") return "amber";
  return "slate";
}

export default function HousekeepingPage() {
  const store = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todo");

  const rows = store.rooms.flatMap((room) => {
    const task = store.tasks.find((t) => t.roomNumber === room.number);
    if (!task || !onBoard(room.occupancy, task.status)) return [];
    return [{ room, task }];
  });

  const toClean = rows.filter(
    (row) =>
      row.room.occupancy === "needs_cleaning" &&
      row.task.status === "not_started",
  ).length;
  const cleaning = rows.filter((row) => row.task.status === "in_progress").length;
  const done = rows.filter((row) => row.task.status === "done").length;

  const visible = rows
    .filter((row) => {
      if (filter === "todo") {
        return row.task.status !== "done";
      }
      if (filter === "needs_clean") {
        return (
          row.room.occupancy === "needs_cleaning" &&
          row.task.status === "not_started"
        );
      }
      return row.task.status === filter;
    })
    .sort((a, b) => {
      const rank = (status: CleaningStatus, occupancy: Occupancy) => {
        if (status === "in_progress") return 0;
        if (occupancy === "needs_cleaning") return 1;
        return 2;
      };
      return rank(a.task.status, a.room.occupancy) - rank(b.task.status, b.room.occupancy);
    });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          icon="fa-broom"
          title="Housekeeping"
          note="Only rooms that were checked out. Start, then finish."
        />
        <div className="mb-5 flex gap-2">
          <Stat label="To clean" value={toClean} />
          <Stat label="Cleaning" value={cleaning} />
          <Stat label="Done" value={done} />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Cleaning board</h2>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={filter === "todo"}
              onClick={() => setFilter("todo")}
            >
              To do {toClean + cleaning}
            </FilterChip>
            <FilterChip
              active={filter === "needs_clean"}
              onClick={() => setFilter("needs_clean")}
            >
              Needs clean {toClean}
            </FilterChip>
            <FilterChip
              active={filter === "in_progress"}
              onClick={() => setFilter("in_progress")}
            >
              Cleaning {cleaning}
            </FilterChip>
            <FilterChip
              active={filter === "done"}
              onClick={() => setFilter("done")}
            >
              Done {done}
            </FilterChip>
          </div>
        </div>

        {message ? (
          <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-rose-700">
            {message}
          </p>
        ) : null}

        <div className="hidden grid-cols-[5rem_8rem_1fr_7rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Room</span>
          <span>Status</span>
          <span>Time</span>
          <span className="text-right">Action</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No rooms need cleaning.
          </p>
        ) : (
          <ul>
            {visible.map((row, index) => {
              const { room, task } = row;
              const duration =
                task.startedAt && task.finishedAt
                  ? formatDuration(task.finishedAt - task.startedAt)
                  : null;
              const time =
                task.status === "done" && duration
                  ? duration
                  : task.status === "in_progress" && task.startedAt
                    ? `Started ${formatTime(task.startedAt)}`
                    : "—";
              const canStart =
                room.occupancy === "needs_cleaning" &&
                task.status === "not_started";

              return (
                <li
                  key={room.number}
                  className={`grid grid-cols-2 items-center gap-2 px-4 py-3 sm:grid-cols-[5rem_8rem_1fr_7rem] ${
                    index < visible.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <p className="font-bold text-slate-900">{room.number}</p>
                  <div>
                    <Badge tone={statusTone(room.occupancy, task.status)}>
                      {statusLabel(room.occupancy, task.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{time}</p>
                  <div className="text-right">
                    {canStart ? (
                      <PrimaryButton
                        onClick={() => setMessage(store.startClean(room.number))}
                      >
                        Start
                      </PrimaryButton>
                    ) : task.status === "in_progress" ? (
                      <GhostButton
                        onClick={() =>
                          setMessage(store.finishClean(room.number))
                        }
                      >
                        Finish
                      </GhostButton>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[4.5rem] rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
