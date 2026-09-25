"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { phoneHref, useBase } from "@/lib/surface";
import { Card, GhostButton, PageTitle } from "@/components/ui";

export default function InboxPage() {
  const store = useStore();
  const base = useBase();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle
          icon="fa-bell"
          title="Alerts"
          note="Sent to your job or your email: ready orders, deep cleans, notes, maintenance updates."
        />
        {store.unreadCount > 0 ? (
          <GhostButton className="mb-5" onClick={store.markAllNoticesRead}>
            Mark all read
          </GhostButton>
        ) : null}
      </div>

      {store.myNotices.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">No alerts.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {store.myNotices.map((n) => {
            const unread = !n.readBy.includes(store.signedInEmail);
            return (
              <li key={n.id}>
                <Link
                  href={base ? phoneHref(n.href) : n.href}
                  onClick={() => store.markNoticeRead(n.id)}
                  className={`block rounded-2xl border px-4 py-3 shadow-sm transition hover:border-teal-400 ${
                    unread ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${unread ? "font-bold" : "font-semibold"} text-slate-900`}>
                      {n.title}
                    </p>
                    {unread ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-label="Unread" />
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
