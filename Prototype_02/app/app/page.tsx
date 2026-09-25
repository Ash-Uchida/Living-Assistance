"use client";

import Link from "next/link";
import { dateKey } from "@/lib/dates";
import { roleCanOpen } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { PHONE_NAV } from "@/lib/surface";
import { TONE_STYLES } from "@/components/ui";

export default function PhoneHome() {
  const store = useStore();
  const links = PHONE_NAV.filter((link) =>
    roleCanOpen(store.access, store.role, link.href),
  );
  const today = dateKey(new Date());
  const occupied = store.rooms.filter((r) => r.occupancy === "occupied").length;
  const cleansLeft = store.cleanJobs.filter(
    (j) =>
      j.status !== "done" &&
      j.dueOn <= today &&
      (store.role !== "housekeeper" || j.assignedTo === store.me?.id),
  ).length;
  const openOrders = store.orders.filter((o) => o.status !== "complete").length;
  const openRequests = store.maintenance.filter((m) => m.status !== "done").length;
  const todaysActivities = store.events.filter(
    (e) => e.kind === "activity" && dateKey(e.startsAt) === today,
  ).length;

  const counts: Record<string, string> = {
    "/app/rooms": `${occupied} checked in`,
    "/app/housekeeping": `${cleansLeft} to clean`,
    "/app/dining": `${openOrders} orders`,
    "/app/maintenance": `${openRequests} open`,
    "/app/calendar": `${todaysActivities} today`,
    "/app/access": "Manager",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
          Homestead Assisted Living
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          What do you need to do?
        </h1>
        <p className="text-sm text-slate-600">
          Open only what your job is allowed to use. Room numbers only — no
          names.
        </p>
      </div>

      <div className="grid gap-3">
        {links.map((link) => {
          const tone = TONE_STYLES[link.tone];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-paper p-5 shadow-sm transition hover:shadow-md ${tone.hover}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-colors ${tone.icon}`}
                >
                  <i className={`fas ${link.icon}`} aria-hidden />
                </div>
                <div>
                  <h2 className={`text-lg font-bold text-slate-900 ${tone.title}`}>
                    {link.label}
                  </h2>
                  <p className="text-sm text-slate-500">{link.hint}</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-800">
                {counts[link.href]}
              </span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={store.reset}
        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
      >
        Reset fake data
      </button>
    </div>
  );
}
