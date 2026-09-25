"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  JOB_ROLES,
  ROLE_BOXES,
  ROLE_LABELS,
  UNASSIGNED_BOX,
  peopleInBox,
} from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import type { RoleBoxId } from "@/lib/seed";
import {
  Card,
  Field,
  PageTitle,
  PrimaryButton,
  TONE_STYLES,
  inputClass,
} from "@/components/ui";

const BOXES = [UNASSIGNED_BOX, ...ROLE_BOXES];

function roleForBox(box: RoleBoxId): Role | null {
  return box === "unassigned" ? null : box;
}

export default function AccessPage() {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState<RoleBoxId | null>(null);
  const [dropOn, setDropOn] = useState<RoleBoxId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open]);

  function addPerson(event: FormEvent) {
    event.preventDefault();
    const result = store.addEmployee(email);
    if (result) {
      setError(result);
      return;
    }
    setEmail("");
    setOpen("unassigned");
    setError(null);
  }

  function movePerson(id: string, box: RoleBoxId) {
    const result = store.changeEmployeeRole(id, roleForBox(box));
    setError(result);
    if (!result) setOpen(box);
  }

  function onDrop(box: RoleBoxId, event: DragEvent) {
    event.preventDefault();
    setDropOn(null);
    const id = event.dataTransfer.getData("text/employee-id");
    if (id) movePerson(id, box);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageTitle
        icon="fa-user-lock"
        title="Access"
        note="Click a job to see every work email in it. Drag someone onto another box to move them."
      />

      <Card>
        <form
          onSubmit={addPerson}
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <Field label="New work email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@homestead.demo"
              className={inputClass}
              required
            />
          </Field>
          <PrimaryButton type="submit">Add to Unassigned</PrimaryButton>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {BOXES.map((box) => {
          const people = peopleInBox(store.employees, box.id);
          const tone = TONE_STYLES[box.tone];
          const active = open === box.id;
          const over = dropOn === box.id;
          return (
            <div
              key={box.id}
              ref={active ? listRef : undefined}
              onDragOver={(event) => {
                event.preventDefault();
                setDropOn(box.id);
              }}
              onDragLeave={() =>
                setDropOn((current) => (current === box.id ? null : current))
              }
              onDrop={(event) => onDrop(box.id, event)}
              className={`rounded-2xl border bg-white shadow-sm transition ${
                active
                  ? "border-teal-600 ring-2 ring-teal-200"
                  : over
                    ? "border-teal-400 ring-2 ring-teal-100"
                    : `border-slate-200/80 ${tone.hover}`
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen((current) => (current === box.id ? null : box.id))}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${tone.icon}`}
                  >
                    <i className={`fas ${box.icon}`} aria-hidden />
                  </div>
                  <div>
                    <p className={`text-sm font-bold text-slate-900 ${tone.title}`}>
                      {box.label}
                    </p>
                    <p className="text-xs text-slate-500">{box.hint}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                  {people.length}
                </span>
              </button>

              {active ? (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Work emails in {box.label}
                  </p>
                  {people.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                      Nobody in this job yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {people.map((person) => (
                        <li
                          key={person.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              "text/employee-id",
                              person.id,
                            );
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <p className="break-all text-sm font-semibold text-slate-900">
                            {person.email}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {store.signedInEmail === person.email
                              ? "Signed in now"
                              : "Drag to another box"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <select
                              value={person.role ?? "unassigned"}
                              onChange={(event) =>
                                movePerson(
                                  person.id,
                                  event.target.value as RoleBoxId,
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                              aria-label={`Move ${person.email}`}
                            >
                              <option value="unassigned">Unassigned</option>
                              {JOB_ROLES.map((job) => (
                                <option key={job} value={job}>
                                  {ROLE_LABELS[job]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setError(store.removeEmployee(person.id))
                              }
                              className="text-xs font-semibold text-rose-700 hover:text-rose-900"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
