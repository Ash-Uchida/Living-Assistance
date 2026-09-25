import { addDays, dateKey } from "./dates";
import type {
  AccessMap,
  AppState,
  CleanJob,
  EmployeeAccount,
  ModuleId,
  Role,
  Room,
} from "./types";

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
  maintenance: "Maintenance",
  activities: "Activities",
};

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DINING_JOBS: ModuleId[] = [
  "dining_order",
  "dining_kitchen",
  "dining_menus",
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
      "hk_assign",
      "dining",
      ...DINING_JOBS,
      "maintenance",
      "maintenance_crew",
      "calendar",
      "attendance",
      "access",
    ],
    housekeeper: ["housekeeping", "maintenance", "calendar"],
    hk_director: ["housekeeping", "hk_assign", "maintenance", "calendar"],
    nurse_station: ["dining", "dining_order", "maintenance", "calendar"],
    kitchen: [
      "dining",
      "dining_kitchen",
      "dining_menus",
      "dining_temps",
      "dining_checklist",
      "maintenance",
      "calendar",
    ],
    dining_manager: [
      "dining",
      "dining_kitchen",
      "dining_menus",
      "dining_survey",
      "dining_manager",
      "maintenance",
      "calendar",
    ],
    maintenance: ["maintenance", "maintenance_crew", "calendar"],
    activities: ["calendar", "attendance", "maintenance"],
  };
}

export function moduleForHref(href: string): ModuleId | null {
  if (href === "/rooms" || href.startsWith("/rooms/")) return "rooms";
  if (href.startsWith("/housekeeping/assign")) return "hk_assign";
  if (href.startsWith("/housekeeping")) return "housekeeping";
  if (href === "/dining/order") return "dining_order";
  if (href === "/dining/kitchen") return "dining_kitchen";
  if (href === "/dining/menus") return "dining_menus";
  if (href === "/dining/temps") return "dining_temps";
  if (href === "/dining/checklist") return "dining_checklist";
  if (href === "/dining/survey") return "dining_survey";
  if (href === "/dining/manager") return "dining_manager";
  if (href === "/dining") return "dining";
  if (href.startsWith("/maintenance")) return "maintenance";
  if (href === "/calendar") return "calendar";
  if (href === "/access") return "access";
  return null;
}

export function roleHas(access: AccessMap, role: Role, moduleId: ModuleId) {
  if (role === "ops_manager") return true;
  return access[role]?.includes(moduleId) ?? false;
}

export function roleCanOpen(access: AccessMap, role: Role, href: string) {
  if (href === "/") return true;
  const mod = moduleForHref(href);
  if (!mod) return true;
  return roleHas(access, role, mod);
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
    hint: "Their rooms, checklists, timer",
    icon: "fa-broom",
    tone: "amber",
  },
  {
    id: "hk_director",
    label: "HK director",
    hint: "Assign rooms and deep cleans",
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
    hint: "Queue, menus, temps",
    icon: "fa-fire-burner",
    tone: "emerald",
  },
  {
    id: "dining_manager",
    label: "Dining manager",
    hint: "Menus, survey, counts",
    icon: "fa-chart-pie",
    tone: "rose",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    hint: "Work requests to done",
    icon: "fa-screwdriver-wrench",
    tone: "slate",
  },
  {
    id: "activities",
    label: "Activities",
    hint: "Calendar and attendance",
    icon: "fa-people-group",
    tone: "sky",
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

export function peopleInBox<T extends { role: Role | null }>(
  employees: T[],
  box: RoleBoxId,
): T[] {
  return employees.filter((person) =>
    box === "unassigned" ? person.role === null : person.role === box,
  );
}

export function employeeName(
  employees: EmployeeAccount[],
  id: string | null,
) {
  if (!id) return "Unassigned";
  const email = employees.find((e) => e.id === id)?.email;
  return email ? email.split("@")[0] : "Unknown";
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
    hint: "Today's cleans, checklists, timer",
    icon: "fa-broom",
    tone: "amber",
  },
  {
    href: "/dining",
    label: "Dining",
    hint: "Menus, orders, kitchen",
    icon: "fa-utensils",
    tone: "emerald",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    hint: "Requests, photos, status",
    icon: "fa-screwdriver-wrench",
    tone: "slate",
  },
  {
    href: "/calendar",
    label: "Activities",
    hint: "Calendar and attendance",
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
    hint: "Dine in or to-go tray",
    icon: "fa-utensils",
    tone: "emerald",
  },
  {
    href: "/dining/kitchen",
    label: "Kitchen queue",
    hint: "Incoming and special orders",
    icon: "fa-fire-burner",
    tone: "amber",
  },
  {
    href: "/dining/menus",
    label: "Menus",
    hint: "Upload and edit by meal",
    icon: "fa-book-open",
    tone: "teal",
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
  maintenance: "maint-1",
  activities: "activities-1",
};

export const JOB_ROLES: Role[] = [
  "ops_manager",
  "housekeeper",
  "hk_director",
  "nurse_station",
  "kitchen",
  "dining_manager",
  "maintenance",
  "activities",
];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isWorkEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/** Adds today's routine cleans for occupied rooms scheduled on this weekday. */
export function withTodaysRoutineCleans(state: AppState, now = Date.now()): AppState {
  const today = dateKey(now);
  const weekday = new Date(now).getDay();
  const missing: CleanJob[] = state.rooms
    .filter(
      (room) =>
        room.occupancy === "occupied" &&
        room.cleanDays.includes(weekday) &&
        !state.cleanJobs.some(
          (job) =>
            job.roomNumber === room.number &&
            job.kind === "routine" &&
            job.dueOn === today,
        ),
    )
    .map((room) => ({
      id: `j-${room.number}-${today}`,
      roomNumber: room.number,
      kind: "routine",
      dueOn: today,
      assignedTo: room.assignedTo,
      status: "not_started",
      startedAt: null,
      finishedAt: null,
      checked: [],
      notes: [],
    }));
  if (missing.length === 0) return state;
  return { ...state, cleanJobs: [...missing, ...state.cleanJobs] };
}

export function seedState(now = Date.now()): AppState {
  const today = dateKey(now);
  const yesterday = dateKey(addDays(new Date(now), -1));
  const twoDaysAgo = dateKey(addDays(new Date(now), -2));
  const wd = new Date(now).getDay();
  const day = (offset: number) => (wd + offset) % 7;

  const room = (
    number: string,
    occupancy: Room["occupancy"],
    assignedTo: string,
    cleanDays: number[],
  ): Room => ({ number, occupancy, assignedTo, cleanDays });

  const routineChecklist = [
    { id: "r-bed", label: "Make bed / change linens" },
    { id: "r-trash", label: "Empty trash" },
    { id: "r-bath", label: "Clean bathroom" },
    { id: "r-dust", label: "Wipe and dust surfaces" },
    { id: "r-floor", label: "Vacuum or mop floor" },
  ];
  const deepChecklist = [
    { id: "d-bed", label: "Strip bed and flip mattress" },
    { id: "d-closet", label: "Empty and wipe closets and drawers" },
    { id: "d-bath", label: "Scrub bathroom top to bottom" },
    { id: "d-walls", label: "Wash walls and baseboards" },
    { id: "d-windows", label: "Clean windows and blinds" },
    { id: "d-floor", label: "Deep clean floors" },
    { id: "d-damage", label: "Check for damage (send a request if any)" },
  ];

  const state: AppState = {
    facilityId: "homestead-1",
    role: "ops_manager",
    staffId: "ops-1",
    signedInEmail: "baker@homestead.demo",
    employees: [
      { id: "e-ops", email: "baker@homestead.demo", role: "ops_manager" },
      { id: "e-hk", email: "housekeeping@homestead.demo", role: "housekeeper" },
      { id: "e-hk2", email: "housekeeping2@homestead.demo", role: "housekeeper" },
      { id: "e-director", email: "director@homestead.demo", role: "hk_director" },
      { id: "e-nurse", email: "station@homestead.demo", role: "nurse_station" },
      { id: "e-kitchen", email: "kitchen@homestead.demo", role: "kitchen" },
      { id: "e-dining", email: "dining@homestead.demo", role: "dining_manager" },
      { id: "e-maint", email: "maintenance@homestead.demo", role: "maintenance" },
      { id: "e-act", email: "activities@homestead.demo", role: "activities" },
      { id: "e-new-1", email: "new.hire@homestead.demo", role: null },
      { id: "e-new-2", email: "float@homestead.demo", role: null },
    ],
    access: defaultAccess(),
    rooms: [
      room("101", "occupied", "e-hk", [day(0), day(3)]),
      room("102", "needs_cleaning", "e-hk", [day(1), day(4)]),
      room("103", "vacant", "e-hk", [day(2), day(5)]),
      room("104", "needs_cleaning", "e-hk", [day(1), day(4)]),
      room("105", "vacant", "e-hk", [day(2), day(5)]),
      room("106", "occupied", "e-hk", [day(0), day(3)]),
      room("107", "occupied", "e-hk2", [day(0), day(4)]),
      room("108", "needs_cleaning", "e-hk2", [day(1), day(4)]),
      room("109", "needs_cleaning", "e-hk2", [day(2), day(5)]),
      room("110", "occupied", "e-hk2", [day(1), day(5)]),
      room("111", "vacant", "e-hk2", [day(2), day(6)]),
      room("112", "vacant", "e-hk2", [day(3), day(6)]),
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
      { id: "maint-1", label: "Maintenance", role: "maintenance" },
      { id: "activities-1", label: "Activities", role: "activities" },
      { id: "ops-1", label: "Operations manager", role: "ops_manager" },
    ],
    cleanChecklists: { routine: routineChecklist, deep: deepChecklist },
    cleanTargets: { routine: 25, deep: 90 },
    cleanJobs: [
      {
        id: "j-106-today",
        roomNumber: "106",
        kind: "routine",
        dueOn: today,
        assignedTo: "e-hk",
        status: "done",
        startedAt: now - minutes(120),
        finishedAt: now - minutes(99),
        checked: routineChecklist.map((i) => i.id),
        notes: [],
      },
      {
        id: "j-102-deep",
        roomNumber: "102",
        kind: "deep",
        dueOn: today,
        assignedTo: "e-hk",
        status: "in_progress",
        startedAt: now - minutes(8),
        finishedAt: null,
        checked: ["d-bed", "d-closet"],
        notes: [],
      },
      {
        id: "j-104-deep",
        roomNumber: "104",
        kind: "deep",
        dueOn: today,
        assignedTo: null,
        status: "not_started",
        startedAt: null,
        finishedAt: null,
        checked: [],
        notes: [],
      },
      {
        id: "j-108-deep",
        roomNumber: "108",
        kind: "deep",
        dueOn: today,
        assignedTo: "e-hk2",
        status: "not_started",
        startedAt: null,
        finishedAt: null,
        checked: [],
        notes: [],
      },
      {
        id: "j-109-deep",
        roomNumber: "109",
        kind: "deep",
        dueOn: today,
        assignedTo: "e-hk2",
        status: "in_progress",
        startedAt: now - minutes(14),
        finishedAt: null,
        checked: ["d-bed"],
        notes: [],
      },
      {
        id: "j-101-yday",
        roomNumber: "101",
        kind: "routine",
        dueOn: yesterday,
        assignedTo: "e-hk",
        status: "done",
        startedAt: now - minutes(24 * 60 + 60),
        finishedAt: now - minutes(24 * 60 + 38),
        checked: routineChecklist.map((i) => i.id),
        notes: [],
      },
      {
        id: "j-107-yday",
        roomNumber: "107",
        kind: "routine",
        dueOn: yesterday,
        assignedTo: "e-hk2",
        status: "done",
        startedAt: now - minutes(24 * 60 + 90),
        finishedAt: now - minutes(24 * 60 + 56),
        checked: routineChecklist.map((i) => i.id),
        notes: [
          {
            id: "n-1",
            text: "Extra towels left on the chair.",
            at: now - minutes(24 * 60 + 60),
            by: "housekeeping2@homestead.demo",
          },
        ],
      },
      {
        id: "j-103-deep-old",
        roomNumber: "103",
        kind: "deep",
        dueOn: twoDaysAgo,
        assignedTo: "e-hk",
        status: "done",
        startedAt: now - minutes(2 * 24 * 60 + 120),
        finishedAt: now - minutes(2 * 24 * 60 + 38),
        checked: deepChecklist.map((i) => i.id),
        notes: [],
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
    menuFiles: [],
    orders: [
      {
        id: "o-1",
        roomNumber: "107",
        meal: "lunch",
        itemId: "l-turkey",
        special: "",
        type: "dine_in",
        status: "pending",
        createdAt: now - minutes(6),
        startedAt: null,
        readyAt: null,
        completedAt: null,
        placedBy: "station@homestead.demo",
        stationId: "station-2",
      },
      {
        id: "o-2",
        roomNumber: "110",
        meal: "lunch",
        itemId: "l-soup",
        special: "Extra crackers",
        type: "to_go",
        status: "preparing",
        createdAt: now - minutes(18),
        startedAt: now - minutes(10),
        readyAt: null,
        completedAt: null,
        placedBy: "station@homestead.demo",
        stationId: "station-2",
      },
      {
        id: "o-3",
        roomNumber: "101",
        meal: "lunch",
        itemId: "l-salad",
        special: "",
        type: "to_go",
        status: "complete",
        createdAt: now - minutes(40),
        startedAt: now - minutes(32),
        readyAt: now - minutes(22),
        completedAt: now - minutes(20),
        placedBy: "station@homestead.demo",
        stationId: "station-2",
      },
      {
        id: "o-4",
        roomNumber: "106",
        meal: "lunch",
        itemId: null,
        special: "Grilled cheese, crust cut off",
        type: "dine_in",
        status: "pending",
        createdAt: now - minutes(3),
        startedAt: null,
        readyAt: null,
        completedAt: null,
        placedBy: "station@homestead.demo",
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
      { id: "f-1", meal: "lunch", itemId: "l-soup", thumbs: "down", createdAt: now - minutes(50) },
      { id: "f-2", meal: "lunch", itemId: "l-turkey", thumbs: "up", createdAt: now - minutes(45) },
      { id: "f-3", meal: "breakfast", itemId: "b-eggs", thumbs: "up", createdAt: now - minutes(240) },
      { id: "f-4", meal: "lunch", itemId: "l-soup", thumbs: "down", createdAt: now - minutes(30) },
    ],
    maintenance: [
      {
        id: "m-1",
        title: "Bathroom faucet drips",
        roomNumber: "107",
        area: "",
        details: "Drips steadily after it is turned off.",
        photos: [],
        priority: "routine",
        status: "open",
        createdAt: now - minutes(70),
        createdBy: "housekeeping2@homestead.demo",
        cleanJobId: null,
        updates: [],
      },
      {
        id: "m-2",
        title: "Hallway light out",
        roomNumber: null,
        area: "2nd floor hallway",
        details: "Second fixture from the elevator.",
        photos: [],
        priority: "urgent",
        status: "in_progress",
        createdAt: now - minutes(180),
        createdBy: "station@homestead.demo",
        cleanJobId: null,
        updates: [
          {
            id: "mu-1",
            status: "in_progress",
            note: "Bulb ordered, ladder on the way.",
            at: now - minutes(120),
            by: "maintenance@homestead.demo",
          },
        ],
      },
      {
        id: "m-3",
        title: "Door closer squeaks",
        roomNumber: "101",
        area: "",
        details: "",
        photos: [],
        priority: "routine",
        status: "done",
        createdAt: now - minutes(3 * 24 * 60),
        createdBy: "housekeeping@homestead.demo",
        cleanJobId: null,
        updates: [
          {
            id: "mu-2",
            status: "done",
            note: "Oiled the hinge.",
            at: now - minutes(2 * 24 * 60),
            by: "maintenance@homestead.demo",
          },
        ],
      },
    ],
    notices: [
      {
        id: "nt-1",
        at: now - minutes(20),
        title: "Room 104 needs a deep clean",
        body: "Checked out. Pick a housekeeper for the deep clean.",
        href: "/housekeeping/assign",
        toRoles: ["hk_director"],
        toEmails: [],
        readBy: [],
      },
      {
        id: "nt-2",
        at: now - minutes(70),
        title: "New request: Bathroom faucet drips",
        body: "Room 107 · Routine",
        href: "/maintenance",
        toRoles: ["maintenance"],
        toEmails: [],
        readBy: [],
      },
    ],
    buildings: ["Main building", "North building", "Courtyard"],
    events: [
      {
        id: "ev-bingo",
        title: "Bingo",
        kind: "activity",
        startsAt: atHour(now, 0, 14),
        building: "Main building",
        roomNumber: null,
        attendance: ["101", "106"],
      },
      {
        id: "ev-music",
        title: "Live music",
        kind: "activity",
        startsAt: atHour(now, 1, 10),
        building: "North building",
        roomNumber: null,
        attendance: [],
      },
      {
        id: "ev-filter",
        title: "Hallway filter check",
        kind: "maintenance",
        startsAt: atHour(now, 2, 9),
        building: "Main building",
        roomNumber: null,
        attendance: [],
      },
      {
        id: "ev-brunch",
        title: "Sunday brunch",
        kind: "activity",
        startsAt: atHour(now, 3, 11),
        building: "Main building",
        roomNumber: null,
        attendance: [],
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
  return withTodaysRoutineCleans(state, now);
}
