import { addDays, dateKey } from "./dates";
import type { AccessMap, AppState, ModuleId, Role } from "./types";

const minutes = (n: number) => n * 60_000;

function atHour(now: number, daysFromToday: number, hour: number, minute = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export const ROLE_LABELS: Record<Role, string> = {
  ops_manager: "Operations manager",
  housekeeper: "Housekeeper",
  hk_director: "Housekeeping director",
  nurse_station: "Nurse station",
  kitchen: "Kitchen",
  dining_manager: "Dining manager",
};

export const EDITABLE_ROLES: Role[] = [
  "housekeeper",
  "hk_director",
  "nurse_station",
  "kitchen",
  "dining_manager",
];

export const ACCESS_MODULES: { id: ModuleId; label: string; href: string }[] = [
  { id: "rooms", label: "Rooms", href: "/rooms" },
  { id: "housekeeping", label: "Housekeeping", href: "/housekeeping" },
  { id: "dining_order", label: "Take order", href: "/dining/order" },
  { id: "dining_kitchen", label: "Kitchen queue", href: "/dining/kitchen" },
  { id: "dining_temps", label: "Fridge temps", href: "/dining/temps" },
  { id: "dining_checklist", label: "Checklist", href: "/dining/checklist" },
  { id: "dining_survey", label: "Meal survey", href: "/dining/survey" },
  { id: "dining_manager", label: "Dining counts", href: "/dining/manager" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
];

const DINING_JOBS: ModuleId[] = [
  "dining_order",
  "dining_kitchen",
  "dining_temps",
  "dining_checklist",
  "dining_survey",
  "dining_manager",
];

export function defaultAccess(): AccessMap {
  return {
    ops_manager: [
      "rooms",
      "housekeeping",
      "dining",
      ...DINING_JOBS,
      "calendar",
      "access",
    ],
    housekeeper: ["housekeeping", "calendar"],
    hk_director: ["housekeeping", "calendar"],
    nurse_station: ["dining", "dining_order", "calendar"],
    kitchen: [
      "dining",
      "dining_kitchen",
      "dining_temps",
      "dining_checklist",
      "calendar",
    ],
    dining_manager: [
      "dining",
      "dining_kitchen",
      "dining_survey",
      "dining_manager",
      "calendar",
    ],
  };
}

export function moduleForHref(href: string): ModuleId | null {
  if (href === "/rooms" || href.startsWith("/rooms/")) return "rooms";
  if (href.startsWith("/housekeeping")) return "housekeeping";
  if (href === "/dining/order") return "dining_order";
  if (href === "/dining/kitchen") return "dining_kitchen";
  if (href === "/dining/temps") return "dining_temps";
  if (href === "/dining/checklist") return "dining_checklist";
  if (href === "/dining/survey") return "dining_survey";
  if (href === "/dining/manager") return "dining_manager";
  if (href === "/dining") return "dining";
  if (href === "/calendar") return "calendar";
  if (href === "/access") return "access";
  return null;
}

export function roleCanOpen(access: AccessMap, role: Role, href: string) {
  if (href === "/") return true;
  if (role === "ops_manager") return true;
  const mod = moduleForHref(href);
  if (!mod) return true;
  return access[role]?.includes(mod) ?? false;
}

export function toggleRoleModule(
  access: AccessMap,
  role: Role,
  moduleId: ModuleId,
): AccessMap {
  if (role === "ops_manager" || moduleId === "access") return access;
  const next = new Set(access[role] ?? []);
  if (next.has(moduleId)) {
    next.delete(moduleId);
    if (moduleId === "dining") {
      for (const job of DINING_JOBS) next.delete(job);
    }
  } else {
    next.add(moduleId);
    if (DINING_JOBS.includes(moduleId)) next.add("dining");
  }
  if (![...next].some((id) => DINING_JOBS.includes(id))) {
    next.delete("dining");
  }
  return { ...access, [role]: [...next] };
}

export type LinkTone = "teal" | "sky" | "emerald" | "amber" | "indigo" | "rose" | "slate";

export type RoleBoxId = Role | "unassigned";

export const ROLE_BOXES: {
  id: Role;
  label: string;
  hint: string;
  icon: string;
  tone: LinkTone;
}[] = [
  {
    id: "ops_manager",
    label: "Operations",
    hint: "Baker. Everything.",
    icon: "fa-user-shield",
    tone: "teal",
  },
  {
    id: "housekeeper",
    label: "Housekeeping",
    hint: "Start and finish cleans",
    icon: "fa-broom",
    tone: "amber",
  },
  {
    id: "hk_director",
    label: "HK director",
    hint: "Housekeeping board",
    icon: "fa-clipboard-list",
    tone: "indigo",
  },
  {
    id: "nurse_station",
    label: "Nurse station",
    hint: "Take meal orders",
    icon: "fa-bell-concierge",
    tone: "sky",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    hint: "Queue, temps, checklist",
    icon: "fa-fire-burner",
    tone: "emerald",
  },
  {
    id: "dining_manager",
    label: "Dining manager",
    hint: "Survey and counts",
    icon: "fa-chart-pie",
    tone: "rose",
  },
];

export const UNASSIGNED_BOX = {
  id: "unassigned" as const,
  label: "New / unassigned",
  hint: "Not in a job yet",
  icon: "fa-user-plus",
  tone: "slate" as const,
};

export function jobLabel(role: Role | null) {
  return role ? ROLE_LABELS[role] : "Unassigned";
}

export function peopleInBox(
  employees: { role: Role | null }[],
  box: RoleBoxId,
) {
  return employees.filter((person) =>
    box === "unassigned" ? person.role === null : person.role === box,
  );
}

export type AppLink = {
  href: string;
  label: string;
  hint: string;
  icon: string;
  tone: LinkTone;
};

export const MAIN_NAV: AppLink[] = [
  {
    href: "/rooms",
    label: "Rooms",
    hint: "Check in and check out",
    icon: "fa-door-open",
    tone: "teal",
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    hint: "Start and finish cleans",
    icon: "fa-broom",
    tone: "amber",
  },
  {
    href: "/dining",
    label: "Dining",
    hint: "Orders, kitchen, temps",
    icon: "fa-utensils",
    tone: "emerald",
  },
  {
    href: "/calendar",
    label: "Calendar",
    hint: "What is happening",
    icon: "fa-calendar-days",
    tone: "sky",
  },
  {
    href: "/access",
    label: "Access",
    hint: "Who can open what",
    icon: "fa-user-lock",
    tone: "indigo",
  },
];

export const DINING_LINKS: AppLink[] = [
  {
    href: "/dining/order",
    label: "Take order",
    hint: "Room, meal, type",
    icon: "fa-utensils",
    tone: "emerald",
  },
  {
    href: "/dining/kitchen",
    label: "Kitchen queue",
    hint: "Orders by room",
    icon: "fa-fire-burner",
    tone: "amber",
  },
  {
    href: "/dining/temps",
    label: "Fridge temps",
    hint: "Shift log",
    icon: "fa-temperature-half",
    tone: "sky",
  },
  {
    href: "/dining/checklist",
    label: "Checklist",
    hint: "End of shift",
    icon: "fa-clipboard-check",
    tone: "indigo",
  },
  {
    href: "/dining/survey",
    label: "Meal survey",
    hint: "Thumbs up or down",
    icon: "fa-thumbs-up",
    tone: "rose",
  },
  {
    href: "/dining/manager",
    label: "Dining counts",
    hint: "How meals went",
    icon: "fa-chart-pie",
    tone: "teal",
  },
];

export const DEFAULT_STAFF: Record<Role, string> = {
  ops_manager: "ops-1",
  housekeeper: "hk-1",
  hk_director: "hk-director",
  nurse_station: "station-2",
  kitchen: "kitchen-am",
  dining_manager: "dining-mgr",
};

export const JOB_ROLES: Role[] = [
  "ops_manager",
  "housekeeper",
  "hk_director",
  "nurse_station",
  "kitchen",
  "dining_manager",
];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isWorkEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function seedState(now = Date.now()): AppState {
  return {
    facilityId: "homestead-1",
    role: "ops_manager",
    staffId: "ops-1",
    signedInEmail: "baker@homestead.demo",
    employees: [
      { id: "e-ops", email: "baker@homestead.demo", role: "ops_manager" },
      { id: "e-hk", email: "housekeeping@homestead.demo", role: "housekeeper" },
      { id: "e-director", email: "director@homestead.demo", role: "hk_director" },
      { id: "e-nurse", email: "station@homestead.demo", role: "nurse_station" },
      { id: "e-kitchen", email: "kitchen@homestead.demo", role: "kitchen" },
      { id: "e-dining", email: "dining@homestead.demo", role: "dining_manager" },
      { id: "e-new-1", email: "new.hire@homestead.demo", role: null },
      { id: "e-new-2", email: "float@homestead.demo", role: null },
    ],
    access: defaultAccess(),
    rooms: [
      { number: "101", assignedStaffId: "hk-1", occupancy: "occupied" },
      { number: "102", assignedStaffId: "hk-1", occupancy: "needs_cleaning" },
      { number: "103", assignedStaffId: "hk-1", occupancy: "vacant" },
      { number: "104", assignedStaffId: "hk-1", occupancy: "needs_cleaning" },
      { number: "105", assignedStaffId: "hk-1", occupancy: "vacant" },
      { number: "106", assignedStaffId: "hk-1", occupancy: "occupied" },
      { number: "107", assignedStaffId: "hk-2", occupancy: "occupied" },
      { number: "108", assignedStaffId: "hk-2", occupancy: "needs_cleaning" },
      { number: "109", assignedStaffId: "hk-2", occupancy: "needs_cleaning" },
      { number: "110", assignedStaffId: "hk-2", occupancy: "occupied" },
      { number: "111", assignedStaffId: "hk-2", occupancy: "vacant" },
      { number: "112", assignedStaffId: "hk-2", occupancy: "vacant" },
    ],
    stays: [
      {
        id: "s-101",
        roomNumber: "101",
        startsOn: dateKey(now - minutes(400)),
        endsOn: dateKey(addDays(new Date(now), 6)),
        checkedInAt: now - minutes(400),
        checkedOutAt: null,
      },
      {
        id: "s-101-old",
        roomNumber: "101",
        startsOn: dateKey(now - minutes(20_000)),
        endsOn: dateKey(now - minutes(8_000)),
        checkedInAt: now - minutes(20_000),
        checkedOutAt: now - minutes(8_000),
      },
      {
        id: "s-102",
        roomNumber: "102",
        startsOn: dateKey(now - minutes(200)),
        endsOn: dateKey(now - minutes(20)),
        checkedInAt: now - minutes(200),
        checkedOutAt: now - minutes(20),
      },
      {
        id: "s-106",
        roomNumber: "106",
        startsOn: dateKey(now - minutes(90)),
        endsOn: dateKey(addDays(new Date(now), 4)),
        checkedInAt: now - minutes(90),
        checkedOutAt: null,
      },
      {
        id: "s-107",
        roomNumber: "107",
        startsOn: dateKey(now - minutes(300)),
        endsOn: dateKey(addDays(new Date(now), 10)),
        checkedInAt: now - minutes(300),
        checkedOutAt: null,
      },
      {
        id: "s-110",
        roomNumber: "110",
        startsOn: dateKey(now - minutes(50)),
        endsOn: dateKey(addDays(new Date(now), 3)),
        checkedInAt: now - minutes(50),
        checkedOutAt: null,
      },
    ],
    staff: [
      { id: "hk-1", label: "Housekeeper 1", role: "housekeeper" },
      { id: "hk-2", label: "Housekeeper 2", role: "housekeeper" },
      { id: "hk-director", label: "HK director", role: "hk_director" },
      { id: "station-2", label: "2nd floor station", role: "nurse_station" },
      { id: "kitchen-am", label: "Kitchen AM", role: "kitchen" },
      { id: "dining-mgr", label: "Dining manager", role: "dining_manager" },
      { id: "ops-1", label: "Operations manager", role: "ops_manager" },
    ],
    tasks: [
      {
        id: "t-101",
        roomNumber: "101",
        staffId: "hk-1",
        status: "done",
        startedAt: now - minutes(140),
        finishedAt: now - minutes(122),
      },
      {
        id: "t-102",
        roomNumber: "102",
        staffId: "hk-1",
        status: "in_progress",
        startedAt: now - minutes(8),
        finishedAt: null,
      },
      {
        id: "t-103",
        roomNumber: "103",
        staffId: "hk-1",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-104",
        roomNumber: "104",
        staffId: "hk-1",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-105",
        roomNumber: "105",
        staffId: "hk-1",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-106",
        roomNumber: "106",
        staffId: "hk-1",
        status: "done",
        startedAt: now - minutes(200),
        finishedAt: now - minutes(179),
      },
      {
        id: "t-107",
        roomNumber: "107",
        staffId: "hk-2",
        status: "done",
        startedAt: now - minutes(90),
        finishedAt: now - minutes(71),
      },
      {
        id: "t-108",
        roomNumber: "108",
        staffId: "hk-2",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-109",
        roomNumber: "109",
        staffId: "hk-2",
        status: "in_progress",
        startedAt: now - minutes(14),
        finishedAt: null,
      },
      {
        id: "t-110",
        roomNumber: "110",
        staffId: "hk-2",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-111",
        roomNumber: "111",
        staffId: "hk-2",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "t-112",
        roomNumber: "112",
        staffId: "hk-2",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
      },
    ],
    menu: [
      { id: "b-eggs", meal: "breakfast", name: "Scrambled eggs" },
      { id: "b-oats", meal: "breakfast", name: "Oatmeal" },
      { id: "b-toast", meal: "breakfast", name: "Toast" },
      { id: "l-turkey", meal: "lunch", name: "Turkey sandwich" },
      { id: "l-soup", meal: "lunch", name: "Tomato soup" },
      { id: "l-salad", meal: "lunch", name: "Garden salad" },
      { id: "d-chicken", meal: "dinner", name: "Baked chicken" },
      { id: "d-potato", meal: "dinner", name: "Mashed potatoes" },
      { id: "d-beans", meal: "dinner", name: "Green beans" },
    ],
    orders: [
      {
        id: "o-1",
        roomNumber: "104",
        meal: "lunch",
        itemId: "l-turkey",
        type: "dine_in",
        status: "pending",
        createdAt: now - minutes(6),
        startedAt: null,
        servedAt: null,
        stationId: "station-2",
      },
      {
        id: "o-2",
        roomNumber: "108",
        meal: "lunch",
        itemId: "l-soup",
        type: "tray",
        status: "preparing",
        createdAt: now - minutes(18),
        startedAt: now - minutes(10),
        servedAt: null,
        stationId: "station-2",
      },
      {
        id: "o-3",
        roomNumber: "101",
        meal: "lunch",
        itemId: "l-salad",
        type: "to_go",
        status: "served",
        createdAt: now - minutes(40),
        startedAt: now - minutes(32),
        servedAt: now - minutes(20),
        stationId: "station-2",
      },
      {
        id: "o-4",
        roomNumber: "112",
        meal: "lunch",
        itemId: "l-turkey",
        type: "dine_in",
        status: "pending",
        createdAt: now - minutes(3),
        startedAt: null,
        servedAt: null,
        stationId: "station-2",
      },
    ],
    fridges: [
      { id: "fridge-a", label: "Kitchen fridge A" },
      { id: "fridge-b", label: "Kitchen fridge B" },
    ],
    temps: [
      {
        id: "temp-1",
        fridgeId: "fridge-a",
        tempF: 38,
        recordedAt: now - minutes(95),
        stationId: "kitchen-am",
      },
    ],
    checklist: [
      { id: "c-1", label: "Counters wiped" },
      { id: "c-2", label: "Sinks emptied and rinsed" },
      { id: "c-3", label: "Trash taken out" },
      { id: "c-4", label: "Dishwasher started" },
      { id: "c-5", label: "Next-shift notes left (no names)" },
    ],
    checklistDone: [
      { itemId: "c-1", completedAt: now - minutes(20), stationId: "kitchen-am" },
      { itemId: "c-2", completedAt: now - minutes(15), stationId: "kitchen-am" },
      { itemId: "c-3", completedAt: null, stationId: null },
      { itemId: "c-4", completedAt: null, stationId: null },
      { itemId: "c-5", completedAt: null, stationId: null },
    ],
    feedback: [
      {
        id: "f-1",
        meal: "lunch",
        itemId: "l-soup",
        thumbs: "down",
        createdAt: now - minutes(50),
      },
      {
        id: "f-2",
        meal: "lunch",
        itemId: "l-turkey",
        thumbs: "up",
        createdAt: now - minutes(45),
      },
      {
        id: "f-3",
        meal: "breakfast",
        itemId: "b-eggs",
        thumbs: "up",
        createdAt: now - minutes(240),
      },
      {
        id: "f-4",
        meal: "lunch",
        itemId: "l-soup",
        thumbs: "down",
        createdAt: now - minutes(30),
      },
    ],
    events: [
      {
        id: "ev-bingo",
        title: "Bingo in the dining room",
        kind: "activity",
        startsAt: atHour(now, 0, 14),
        roomNumber: null,
      },
      {
        id: "ev-music",
        title: "Music in the lobby",
        kind: "activity",
        startsAt: atHour(now, 1, 10),
        roomNumber: null,
      },
      {
        id: "ev-filter",
        title: "Hallway filter check",
        kind: "maintenance",
        startsAt: atHour(now, 2, 9),
        roomNumber: null,
      },
      {
        id: "ev-brunch",
        title: "Sunday brunch",
        kind: "activity",
        startsAt: atHour(now, 3, 11),
        roomNumber: null,
      },
    ],
    supplies: [
      { id: "s-gloves", label: "Gloves (boxes)", count: 12 },
      { id: "s-cups", label: "Cups", count: 80 },
      { id: "s-tissues", label: "Tissues", count: 6 },
    ],
    census: 48,
    invoiceTotal: 1240,
  };
}
