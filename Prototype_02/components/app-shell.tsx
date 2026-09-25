"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { problemsFor } from "@/lib/insights";
import {
  ADMIN_LINKS,
  DEPARTMENT_LINKS,
  INSIGHT_LINKS,
  ROLE_LABELS,
  roleCanOpen,
} from "@/lib/seed";
import type { AppLink } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { canUseWebsite } from "@/lib/surface";
import { useNow } from "@/lib/use-now";
import type { Department } from "@/lib/types";

type NavItem = AppLink & { count?: number; key: string };

function useNavActive() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (href: string) => {
    const [path, query] = href.split("?");
    if (path === "/") return pathname === "/";
    if (path === "/calendar") {
      const dept = new URLSearchParams(query ?? "").get("dept");
      return pathname === "/calendar" && (params.get("dept") ?? null) === dept;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-slate-500">
      Loading…
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const now = useNow(30_000);
  const isActive = useNavActive();
  const [drawer, setDrawer] = useState(false);
  const signedIn = Boolean(store.signedInEmail);
  const manager = signedIn && canUseWebsite(store.role);
  const onSignIn = pathname === "/signin";
  const allowed = roleCanOpen(store.access, store.role, pathname);

  useEffect(() => {
    if (!store.ready) return;
    if (!signedIn && !onSignIn) router.replace("/signin");
    if (manager && onSignIn) router.replace("/");
  }, [store.ready, signedIn, manager, onSignIn, router]);

  const problems = useMemo(() => problemsFor(store, now), [store, now]);
  const countFor = (d?: Department) =>
    d ? problems.filter((p) => p.department === d).length : undefined;

  const can = (link: AppLink) => roleCanOpen(store.access, store.role, link.href);
  const today: NavItem = {
    key: "today",
    href: "/",
    label: "Today",
    hint: "",
    icon: "fa-table-cells-large",
    tone: "teal",
    count: problems.length,
  };
  const departments: NavItem[] = DEPARTMENT_LINKS.filter(can).map((link) => ({
    ...link,
    key: link.label,
    href: link.department === "activities" ? "/calendar?dept=activities" : link.href,
    count: countFor(link.department),
  }));
  const insights: NavItem[] = INSIGHT_LINKS.filter(can).map((link) => ({ ...link, key: link.label }));
  const admin: NavItem[] = ADMIN_LINKS.filter(can).map((link) => ({ ...link, key: link.label }));
  const mobileTabs = [...insights, ...departments.filter((d) => d.href !== "/rooms")].slice(0, 3);

  if (!store.ready || (!signedIn && !onSignIn) || (manager && onSignIn)) return <Loading />;

  if (onSignIn) {
    return <main className="mx-auto w-full max-w-7xl px-4 py-10">{children}</main>;
  }

  const signOut = () => {
    store.signOut();
    router.replace("/signin");
  };

  if (!manager) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-paper p-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">This website is for managers</h1>
          <p className="text-sm text-slate-600">
            You are signed in as {store.signedInEmail} ({ROLE_LABELS[store.role]}). Your work is in the Homestead
            phone app.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/app" className="rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white">
              Open the phone app
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  const nav = (
    <>
      <NavGroup items={[today]} isActive={isActive} onPick={() => setDrawer(false)} />
      <NavGroup title="Departments" items={departments} isActive={isActive} onPick={() => setDrawer(false)} />
      <NavGroup title="Insights" items={insights} isActive={isActive} onPick={() => setDrawer(false)} />
      <NavGroup title="Admin" items={admin} isActive={isActive} onPick={() => setDrawer(false)} />
    </>
  );

  const account = (
    <div className="space-y-2 rounded-xl bg-teal-950/40 p-3">
      <p className="truncate text-xs font-semibold text-white">{store.signedInEmail}</p>
      <p className="text-[11px] text-teal-200">{ROLE_LABELS[store.role]}</p>
      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-lg bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-white"
      >
        Sign out
      </button>
    </div>
  );

  const dateLine = new Date(now).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-teal-900 px-4 py-6 text-teal-50 md:flex">
        <Link href="/" className="px-2">
          <span className="block font-serif text-2xl font-semibold text-white">Homestead</span>
          <span className="text-xs text-teal-200">{dateLine}</span>
        </Link>
        <div className="mt-6 flex-1 space-y-5 overflow-y-auto">
          {nav}
          <AlertsLink count={store.unreadCount} active={pathname === "/inbox"} />
          <Link
            href="/app"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-teal-50 hover:bg-teal-800"
          >
            <i className="fas fa-mobile-screen w-4 text-center text-xs" aria-hidden />
            Staff phone app
          </Link>
        </div>
        <p className="mb-3 px-2 text-[10px] leading-snug text-teal-300">
          Demo only. Room numbers only. No names or health information.
        </p>
        {account}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-teal-900 px-4 py-3 text-white md:hidden">
        <Link href="/">
          <span className="block font-serif text-lg font-semibold">Homestead</span>
          <span className="text-[11px] text-teal-200">{dateLine}</span>
        </Link>
        <div className="flex items-center gap-2">
          <AlertsLink count={store.unreadCount} active={pathname === "/inbox"} compact />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-800"
          >
            <i className="fas fa-bars" aria-hidden />
          </button>
        </div>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawer(false)}
          />
          <div
            role="dialog"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-72 flex-col gap-5 overflow-y-auto bg-teal-900 p-5 text-teal-50"
          >
            {nav}
            {account}
          </div>
        </div>
      ) : null}

      <main className="px-4 pb-28 pt-6 sm:px-6 md:ml-60 md:px-8 md:pb-12">
        {allowed ? (
          children
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-paper p-6 text-center">
            <p className="font-serif text-lg font-semibold text-slate-900">You do not have access</p>
            <p className="mt-2 text-sm text-slate-600">
              Your job does not include this screen. An operations manager can change it under Access.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-teal-700">
              Back to Today
            </Link>
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around bg-teal-900 px-2 pb-3 pt-2 text-teal-100 md:hidden">
        {[today, ...mobileTabs].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`relative flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
              isActive(item.href) ? "bg-cream text-teal-900" : ""
            }`}
          >
            <i className={`fas ${item.icon} text-sm`} aria-hidden />
            {item.label === "Weekly pulse" ? "Pulse" : item.label === "Maintenance" ? "Repairs" : item.label}
            {item.count ? (
              <span className="absolute right-1 top-0 min-w-4 rounded-full bg-rose-400 px-1 text-center text-[9px] leading-4 text-white">
                {item.count}
              </span>
            ) : null}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold"
        >
          <i className="fas fa-ellipsis text-sm" aria-hidden />
          More
        </button>
      </nav>
    </div>
  );
}

function NavGroup({
  title,
  items,
  isActive,
  onPick,
}: {
  title?: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-teal-300">{title}</p>
      ) : null}
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onPick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
              active ? "bg-cream text-teal-900" : "text-teal-50 hover:bg-teal-800"
            }`}
          >
            <i className={`fas ${item.icon} w-4 text-center text-xs`} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.count ? (
              <span
                className={`min-w-5 rounded-full px-1.5 text-center text-[10px] font-bold leading-5 ${
                  active ? "bg-rose-100 text-rose-800" : "bg-rose-200 text-rose-900"
                }`}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function AlertsLink({ count, active, compact }: { count: number; active: boolean; compact?: boolean }) {
  return (
    <Link
      href="/inbox"
      aria-label={`Alerts, ${count} unread`}
      className={
        compact
          ? "relative flex h-9 w-9 items-center justify-center rounded-lg bg-teal-800"
          : `relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
              active ? "bg-cream text-teal-900" : "text-teal-50 hover:bg-teal-800"
            }`
      }
    >
      <i className="fas fa-bell w-4 text-center text-xs" aria-hidden />
      {compact ? null : <span className="flex-1">Alerts</span>}
      {count > 0 ? (
        <span
          className={`min-w-5 rounded-full bg-rose-500 px-1.5 text-center text-[10px] font-bold leading-5 text-white ${
            compact ? "absolute -right-1 -top-1" : ""
          }`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
