"use client";

import { usePathname } from "next/navigation";
import type { AppLink } from "./seed";
import type { Role } from "./types";

/** Jobs that can sign in to the manager website. Everyone can use the phone app at /app. */
export const WEBSITE_ROLES: Role[] = ["ops_manager", "hk_director", "dining_manager"];

export function canUseWebsite(role: Role | null | undefined) {
  return role ? WEBSITE_ROLES.includes(role) : false;
}

export const PHONE_BASE = "/app";

export function isPhonePath(pathname: string) {
  return pathname === PHONE_BASE || pathname.startsWith(`${PHONE_BASE}/`);
}

/** "/app" inside the phone app, "" on the website, so shared screens link within their own surface. */
export function useBase() {
  return isPhonePath(usePathname()) ? PHONE_BASE : "";
}

const PHONE_ROUTES = ["/rooms", "/housekeeping", "/dining", "/maintenance", "/calendar", "/inbox", "/access"];

/** Alerts store website paths; open them in the phone app when the phone app has that screen. */
export function phoneHref(href: string) {
  const path = href.split(/[?#]/)[0];
  const onPhone = path === "/" || PHONE_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
  return onPhone ? `${PHONE_BASE}${href === "/" ? "" : href}` : href;
}

export const PHONE_NAV: AppLink[] = [
  { href: "/app/rooms", label: "Rooms", hint: "Check in and check out", icon: "fa-door-open", tone: "teal" },
  { href: "/app/housekeeping", label: "Housekeeping", hint: "Today's cleans, checklists, timer", icon: "fa-broom", tone: "amber" },
  { href: "/app/dining", label: "Dining", hint: "Menus, orders, kitchen", icon: "fa-utensils", tone: "emerald" },
  { href: "/app/maintenance", label: "Maintenance", hint: "Requests, photos, status", icon: "fa-screwdriver-wrench", tone: "slate" },
  { href: "/app/calendar", label: "Activities", hint: "Calendar and attendance", icon: "fa-calendar-days", tone: "sky" },
  { href: "/app/access", label: "Access", hint: "Who can open what", icon: "fa-user-lock", tone: "indigo" },
];
