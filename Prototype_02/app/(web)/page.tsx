"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { dateKey } from "@/lib/dates";
import { problemsFor } from "@/lib/insights";
import type { Problem } from "@/lib/insights";
import {
  ADMIN_LINKS,
  DEPARTMENT_LABEL,
  DEPARTMENT_LINKS,
  JOB_ROLES,
  ROLE_LABELS,
  roleCanOpen,
  roleHas,
} from "@/lib/seed";
import type { AppLink } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { Department, Role } from "@/lib/types";
import { Field, GhostButton, LevelTag, PrimaryButton, TONE_STYLES, inputClass } from "@/components/ui";

function greeting(now: number) {
  const hour = new Date(now).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Today() {
  const store = useStore();
  const now = useNow(30_000);
  const [composer, setComposer] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const problems = useMemo(() => problemsFor(store, now), [store, now]);
  const today = dateKey(now);
  const canSend = roleHas(store.access, store.role, "notices_send");

  const count = (d: Department) => problems.filter((p) => p.department === d).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const todaysJobs = store.cleanJobs.filter(
    (j) =>
      j.dueOn === today &&
      (store.role !== "housekeeper" || j.assignedTo === store.me?.id),
  );
  const activitiesToday = store.events.filter(
    (e) => e.kind === "activity" && dateKey(e.startsAt) === today,
  ).length;
  const stats: Record<string, string> = {
    "/rooms": `${store.rooms.filter((r) => r.occupancy === "occupied").length} checked in · ${
      store.rooms.filter((r) => r.occupancy === "needs_cleaning").length
    } need a deep clean`,
    "/housekeeping": `${plural(count("housekeeping"), "problem")} · ${
      todaysJobs.filter((j) => j.status === "done").length
    } of ${todaysJobs.length} rooms cleaned`,
    "/dining": `${plural(count("dining"), "problem")} · ${
      store.orders.filter((o) => o.status === "preparing").length
    } cooking · ${plural(
      store.orders.filter((o) => o.type === "to_go" && o.status !== "complete").length,
      "to-go tray",
    )}`,
    "/maintenance": `${plural(count("maintenance"), "problem")} · ${plural(
      store.maintenance.filter((m) => m.status !== "done").length,
      "open request",
    )}`,
    "/calendar": `${plural(count("activities"), "problem")} · ${activitiesToday} ${
      activitiesToday === 1 ? "activity" : "activities"
    } today`,
    "/access": `${store.employees.length} work emails`,
  };
  const cards: (AppLink & { department?: Department })[] = [...DEPARTMENT_LINKS, ...ADMIN_LINKS].filter((link) =>
    roleCanOpen(store.access, store.role, link.href),
  );
  const visible = showAll ? problems : problems.slice(0, 3);

  function act(problem: Problem) {
    if (problem.action.kind !== "alert") return;
    const error = store.resendOrderAlert(problem.action.orderId);
    if (error) {
      setFlash(error);
      return;
    }
    setSent((ids) => [...ids, problem.id]);
    setFlash(`Alert sent again for ${problem.title.split(", ")[1] ?? "the order"}.`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{greeting(now)}</p>
          <h1 className="text-3xl font-semibold text-slate-900">Today at a glance</h1>
        </div>
        {canSend ? (
          <PrimaryButton type="button" onClick={() => setComposer((open) => !open)} aria-expanded={composer}>
            Send a notice
          </PrimaryButton>
        ) : null}
      </div>

      {composer ? (
        <NoticeComposer
          onDone={(message) => {
            setComposer(false);
            setFlash(message);
          }}
        />
      ) : null}
      {flash ? (
        <p role="status" className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
          {flash}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-label="Departments" className="order-2 lg:order-1">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 lg:hidden">
            Departments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((link) => {
              const tone = TONE_STYLES[link.tone];
              const hasProblems = link.department ? count(link.department) > 0 : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group rounded-2xl border border-slate-200 bg-paper p-5 transition hover:shadow-md ${tone.hover}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                      <i className={`fas ${link.icon}`} aria-hidden />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900">{link.label}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{link.hint}</p>
                  <p
                    className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${
                      hasProblems ? "text-rose-700" : "text-teal-700"
                    }`}
                  >
                    <i
                      className={`fas ${hasProblems ? "fa-triangle-exclamation" : "fa-circle-check"}`}
                      aria-hidden
                    />
                    {stats[link.href]}
                  </p>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={store.reset}
            className="mt-6 text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            Reset fake data
          </button>
        </section>

        <section
          aria-label="Problems to solve"
          className="order-1 h-fit rounded-2xl border border-slate-200 bg-paper p-4 lg:order-2"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Problems to solve</h2>
            <span className="text-xs text-slate-500">
              {problems.length === 0 ? "All clear" : `${problems.length} open`}
            </span>
          </div>
          {problems.length === 0 ? (
            <p className="rounded-xl bg-teal-50 px-3 py-4 text-sm text-teal-900">
              Nothing needs you right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((problem) => (
                <li
                  key={problem.id}
                  className={`rounded-xl border p-3 ${
                    problem.level === "urgent" ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LevelTag level={problem.level} />
                    <span className="text-[11px] text-slate-500">{DEPARTMENT_LABEL[problem.department]}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{problem.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">{problem.detail}</p>
                    {problem.action.kind === "link" ? (
                      <Link
                        href={problem.action.href}
                        className="shrink-0 rounded-lg border border-teal-800 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50"
                      >
                        {problem.action.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => act(problem)}
                        disabled={sent.includes(problem.id)}
                        className="shrink-0 rounded-lg border border-teal-800 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50 disabled:border-slate-300 disabled:text-slate-400"
                      >
                        {sent.includes(problem.id) ? "Alert sent" : problem.action.label}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {problems.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAll((all) => !all)}
              className="mt-3 text-xs font-semibold text-teal-700"
            >
              {showAll ? "Show top 3" : `Show all ${problems.length}`}
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function NoticeComposer({ onDone }: { onDone: (message: string) => void }) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.sendNotice({ title, body, toRoles: roles });
    if (result) {
      setError(result);
      return;
    }
    onDone(`Notice sent to ${roles.length} ${roles.length === 1 ? "job" : "jobs"}.`);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-paper p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Send a notice</h2>
        <p className="text-xs text-slate-500">Goes to everyone in the jobs you pick. No resident names or health details.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Notice title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message">
          <input className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-slate-700">Send to</legend>
        <div className="flex flex-wrap gap-2">
          {JOB_ROLES.map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
            >
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() =>
                  setRoles((current) =>
                    current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
                  )
                }
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex gap-2">
        <PrimaryButton type="submit">Send notice</PrimaryButton>
        <GhostButton type="button" onClick={() => onDone("Notice not sent.")}>
          Cancel
        </GhostButton>
      </div>
    </form>
  );
}
