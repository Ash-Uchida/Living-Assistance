"use client";

import Link from "next/link";
import { DINING_LINKS, roleCanOpen } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { TONE_STYLES, PageTitle } from "@/components/ui";

export default function DiningHubPage() {
  const store = useStore();
  const links = DINING_LINKS.filter((link) =>
    roleCanOpen(store.access, store.role, link.href),
  );

  return (
    <div>
      <PageTitle
        icon="fa-utensils"
        title="Dining"
        note="Pick one job. You can always come back here."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const tone = TONE_STYLES[link.tone];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md ${tone.hover}`}
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${tone.icon}`}
              >
                <i className={`fas ${link.icon}`} aria-hidden />
              </div>
              <h2 className={`text-sm font-bold text-slate-900 ${tone.title}`}>
                {link.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{link.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
