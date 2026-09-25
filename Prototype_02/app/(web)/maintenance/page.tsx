"use client";

import { useEffect, useState } from "react";
import {
  MAINTENANCE_STATUS_LABEL,
  PRIORITY_LABEL,
  formatDateTime,
} from "@/lib/format";
import { employeeName, roleHas } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { MaintenanceRequest, MaintenanceStatus } from "@/lib/types";
import { MaintenanceForm } from "@/components/maintenance-form";
import {
  Badge,
  Card,
  FilterChip,
  GhostButton,
  PageTitle,
  PrimaryButton,
  inputClass,
} from "@/components/ui";

type Filter = "active" | "done" | "mine";

const STATUS_TONE: Record<MaintenanceStatus, "slate" | "amber" | "indigo" | "teal"> = {
  open: "slate",
  in_progress: "amber",
  waiting: "indigo",
  done: "teal",
};

const STATUSES: MaintenanceStatus[] = ["open", "in_progress", "waiting", "done"];

export default function MaintenancePage() {
  const store = useStore();
  const crew = roleHas(store.access, store.role, "maintenance_crew");
  const [filter, setFilter] = useState<Filter>(crew ? "active" : "mine");
  const [showForm, setShowForm] = useState(!crew);
  const [message, setMessage] = useState<string | null>(null);

  const active = store.maintenance.filter((m) => m.status !== "done");
  const done = store.maintenance.filter((m) => m.status === "done");
  const mine = store.maintenance.filter((m) => m.createdBy === store.signedInEmail);
  const visible = (filter === "active" ? active : filter === "done" ? done : mine)
    .slice()
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageTitle
        icon="fa-screwdriver-wrench"
        title="Maintenance"
        note={
          crew
            ? "Every request with photos. Move each one along until it is complete — the person who sent it gets an alert."
            : "Send a request with photos. You get an alert when maintenance updates it."
        }
      />

      <Card>
        {showForm ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">New request</h2>
              {crew ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500"
                  onClick={() => setShowForm(false)}
                >
                  Close
                </button>
              ) : null}
            </div>
            <MaintenanceForm
              onSent={(msg) => {
                setMessage(msg);
                setFilter(crew ? "active" : "mine");
              }}
            />
          </div>
        ) : (
          <PrimaryButton onClick={() => setShowForm(true)}>New request</PrimaryButton>
        )}
        {message ? <p className="mt-3 text-sm font-semibold text-teal-800">{message}</p> : null}
      </Card>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>
          Open {active.length}
        </FilterChip>
        <FilterChip active={filter === "done"} onClick={() => setFilter("done")}>
          Complete {done.length}
        </FilterChip>
        <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")}>
          Sent by me {mine.length}
        </FilterChip>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((request) => (
            <RequestCard key={request.id} request={request} crew={crew} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({ request, crew }: { request: MaintenanceRequest; crew: boolean }) {
  const store = useStore();
  const [status, setStatus] = useState<MaintenanceStatus>(request.status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const where = request.roomNumber ? `Room ${request.roomNumber}` : request.area;
  const team = store.employees.filter((e) => e.role === "maintenance");

  useEffect(() => {
    if (crew && request.status !== "done" && !request.seenAt) store.markMaintenanceSeen(request.id);
  }, [crew, request.id, request.status, request.seenAt, store]);

  return (
    <li id={request.id} className="scroll-mt-24">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{request.title}</p>
            <p className="text-xs text-slate-500">
              {where} · {formatDateTime(request.createdAt)} · {request.createdBy.split("@")[0]}
              {request.cleanJobId ? " · from a clean" : ""}
            </p>
            <p className="text-xs text-slate-500">
              {request.assignedTo
                ? `Assigned to ${employeeName(store.employees, request.assignedTo)}`
                : "No one assigned"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {request.priority === "urgent" ? (
              <Badge tone="rose">{PRIORITY_LABEL.urgent}</Badge>
            ) : null}
            <Badge tone={STATUS_TONE[request.status]}>
              {MAINTENANCE_STATUS_LABEL[request.status]}
            </Badge>
          </div>
        </div>

        {request.details ? <p className="text-sm text-slate-700">{request.details}</p> : null}

        {request.photos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {request.photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${request.title} photo ${i + 1}`}
                  className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                />
              </a>
            ))}
          </div>
        ) : null}

        {request.updates.length > 0 ? (
          <ol className="space-y-1 border-l-2 border-slate-100 pl-3 text-xs text-slate-600">
            {request.updates.map((u) => (
              <li key={u.id}>
                <span className="font-semibold text-slate-800">
                  {MAINTENANCE_STATUS_LABEL[u.status]}
                </span>
                {u.note ? ` — ${u.note}` : ""} · {u.by.split("@")[0]} · {formatDateTime(u.at)}
              </li>
            ))}
          </ol>
        ) : null}

        {crew && request.status !== "done" ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <label htmlFor={`assign-${request.id}`} className="text-xs font-semibold text-slate-700">
              Assign to
            </label>
            <select
              id={`assign-${request.id}`}
              aria-label={`Assign ${request.title}`}
              className={`${inputClass} w-auto`}
              value={request.assignedTo ?? ""}
              onChange={(e) => setError(store.assignMaintenance(request.id, e.target.value || null))}
            >
              <option value="">Unassigned</option>
              {team.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.email.split("@")[0]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {crew && request.status !== "done" ? (
          <form
            className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[10rem_1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const result = store.updateMaintenance(request.id, status, note);
              setError(result);
              if (!result) setNote("");
            }}
          >
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
              aria-label={`Status for ${request.title}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MAINTENANCE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was done (optional)"
              aria-label={`Update note for ${request.title}`}
            />
            <GhostButton type="submit">Update</GhostButton>
            {error ? <p className="text-sm text-rose-700 sm:col-span-3">{error}</p> : null}
          </form>
        ) : null}
      </Card>
    </li>
  );
}
