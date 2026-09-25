"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  CLEAN_KIND_LABEL,
  CLEANING_LABEL,
  formatClock,
  formatDuration,
  formatTime,
} from "@/lib/format";
import { employeeName } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { MaintenanceForm } from "@/components/maintenance-form";
import { Badge, Card, GhostButton, PrimaryButton, inputClass } from "@/components/ui";

export default function CleanPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const now = useNow();
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  const job = store.cleanJobs.find((j) => j.id === id);
  if (!job) {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-center">
        <p className="font-bold text-slate-900">That clean is not on the list.</p>
        <Link href="/housekeeping" className="text-sm font-semibold text-teal-700">
          Back to housekeeping
        </Link>
      </div>
    );
  }

  const items = store.cleanChecklists[job.kind];
  const target = store.cleanTargets[job.kind];
  const elapsed =
    job.startedAt === null ? 0 : (job.finishedAt ?? now) - job.startedAt;
  const over = elapsed > target * 60_000;
  const left = items.filter((item) => !job.checked.includes(item.id)).length;
  const working = job.status === "in_progress";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/housekeeping"
        className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
      >
        <i className="fas fa-arrow-left" aria-hidden />
        Back to housekeeping
      </Link>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Room {job.roomNumber}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone={job.kind === "deep" ? "indigo" : "slate"}>
              {CLEAN_KIND_LABEL[job.kind]}
            </Badge>
            <Badge tone={job.status === "done" ? "teal" : working ? "amber" : "slate"}>
              {CLEANING_LABEL[job.status]}
            </Badge>
            <span>{employeeName(store.employees, job.assignedTo)}</span>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`font-mono text-3xl font-bold ${over ? "text-rose-700" : "text-slate-900"}`}
            aria-label="Timer"
          >
            {job.status === "done" ? formatDuration(elapsed) : formatClock(elapsed)}
          </p>
          <p className={`text-xs ${over ? "font-semibold text-rose-700" : "text-slate-500"}`}>
            Target {target} min{over ? " · over target" : ""}
          </p>
        </div>
      </Card>

      {message ? <p className="text-sm font-semibold text-teal-800">{message}</p> : null}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Checklist</h2>
          <p className="text-xs text-slate-500">
            {items.length - left} of {items.length} done
          </p>
        </div>
        {!working && job.status === "not_started" ? (
          <p className="text-xs text-slate-500">Start the clean to check items off.</p>
        ) : null}
        <ul className="space-y-2">
          {items.map((item) => {
            const checked = job.checked.includes(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                    checked ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"
                  } ${working ? "cursor-pointer" : "opacity-70"}`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-teal-700"
                    checked={checked}
                    disabled={!working}
                    onChange={() => store.toggleJobItem(job.id, item.id)}
                  />
                  <span className={checked ? "text-slate-500 line-through" : "text-slate-900"}>
                    {item.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          {job.status === "not_started" ? (
            <PrimaryButton onClick={() => setMessage(store.startJob(job.id))}>
              Start clean
            </PrimaryButton>
          ) : null}
          {working ? (
            <PrimaryButton
              onClick={() => {
                const error = store.finishJob(job.id);
                setMessage(error ?? `Room ${job.roomNumber} finished.`);
              }}
            >
              Finish clean
            </PrimaryButton>
          ) : null}
          {job.status === "done" && job.finishedAt ? (
            <p className="text-sm text-slate-600">Finished at {formatTime(job.finishedAt)}.</p>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Notes and requests</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const error = store.addJobNote(job.id, note);
            if (error) {
              setMessage(error);
              return;
            }
            setNote("");
            setMessage("Note saved. The housekeeping director was notified.");
          }}
        >
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the director — no resident names"
            aria-label="Note"
          />
          <GhostButton type="submit">Add note</GhostButton>
        </form>

        {job.notes.length > 0 ? (
          <ul className="space-y-2">
            {job.notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-900">{n.text}</p>
                <p className="text-[11px] text-slate-500">
                  {n.by.split("@")[0]} · {formatTime(n.at)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="border-t border-slate-100 pt-3">
          {showRequest ? (
            <MaintenanceForm
              roomNumber={job.roomNumber}
              cleanJobId={job.id}
              onSent={(msg) => {
                setShowRequest(false);
                setMessage(msg);
              }}
            />
          ) : (
            <GhostButton onClick={() => setShowRequest(true)}>
              <i className="fas fa-screwdriver-wrench mr-1.5" aria-hidden />
              Maintenance request
            </GhostButton>
          )}
        </div>
      </Card>
    </div>
  );
}
