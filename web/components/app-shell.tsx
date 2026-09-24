"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MAIN_NAV, ROLE_LABELS, roleCanOpen } from "@/lib/seed";
import { useStore } from "@/lib/store";

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const signedIn = Boolean(store.signedInEmail);
  const onSignIn = pathname === "/signin";
  const links = MAIN_NAV.filter((link) =>
    roleCanOpen(store.access, store.role, link.href),
  );
  const allowed = roleCanOpen(store.access, store.role, pathname);

  useEffect(() => {
    if (!store.ready) return;
    if (!signedIn && !onSignIn) router.replace("/signin");
    if (signedIn && onSignIn) router.replace("/");
  }, [store.ready, signedIn, onSignIn, router]);

  if (!store.ready || (!signedIn && !onSignIn) || (signedIn && onSignIn)) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-teal-700 bg-teal-800 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={signedIn ? "/" : "/signin"} className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-600 text-white shadow-inner">
              <i className="fas fa-heart-pulse text-lg" aria-hidden />
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-widest text-teal-200 leading-none">
                Homestead
              </span>
              <span className="text-lg font-bold tracking-tight leading-tight">
                Operations
              </span>
            </div>
          </Link>

          {signedIn ? (
            <>
              <nav className="hidden items-center gap-6 text-sm font-medium text-teal-100 md:flex">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      navActive(pathname, link.href)
                        ? "text-white"
                        : "hover:text-white"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex max-w-[14rem] flex-col items-end text-right">
                <span className="truncate text-xs font-medium text-white">
                  {store.signedInEmail}
                </span>
                <span className="text-[10px] text-teal-200">
                  {ROLE_LABELS[store.role]}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    store.signOut();
                    router.replace("/signin");
                  }}
                  className="text-[10px] font-semibold text-teal-100 underline-offset-2 hover:underline"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      <p className="border-b border-teal-100 bg-teal-50 px-4 py-2 text-center text-xs text-teal-900">
        Demo only. Room numbers only. No names or health information.
      </p>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {onSignIn || allowed ? (
          children
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="font-bold text-slate-900">You do not have access</p>
            <p className="mt-2 text-sm text-slate-600">
              Your job does not include this screen. An operations manager can
              change it under Access.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-semibold text-teal-700"
            >
              Back home
            </Link>
          </div>
        )}
      </main>

      {signedIn ? (
        <nav className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-lg items-center justify-around rounded-full border border-slate-700/80 bg-slate-900/90 p-2 text-white shadow-2xl backdrop-blur-lg md:hidden">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold ${
              pathname === "/" ? "text-teal-300" : "text-slate-300"
            }`}
          >
            <i className="fas fa-house text-sm" aria-hidden />
            Home
          </Link>
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold ${
                navActive(pathname, link.href) ? "text-teal-300" : "text-slate-300"
              }`}
            >
              <i className={`fas ${link.icon} text-sm`} aria-hidden />
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
