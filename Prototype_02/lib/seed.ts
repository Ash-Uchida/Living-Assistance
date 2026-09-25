import { addDays, dateKey } from "./dates";
import type {
  AccessMap,
  AppState,
  CalendarEvent,
  CleanJob,
  Department,
  EmployeeAccount,
  FeedbackTopic,
  MaintenanceRequest,
  MealOrder,
  ModuleId,
  Role,
  Room,
  RoomFeedback,
  StaffingDay,
} from "./types";

const minutes = (n: number) => n * 60_000;
const hours = (n: number) => n * 3_600_000;

function atHour(now: number, daysFromToday: number, hour: number, minute = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

/** Small deterministic random so seeded history looks the same every reset. */
function random(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
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

export const DEPARTMENT_LABEL: Record<Department, string> = {
  housekeeping: "Housekeeping",
  dining: "Dining",
  maintenance: "Maintenance",
  activities: "Activities",
};

/** The job that owns each department's follow-ups. */
export const DEPARTMENT_LEAD: Record<Department, Role> = {
  housekeeping: "hk_director",
  dining: "dining_manager",
  maintenance: "maintenance",
  activities: "activities",
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
      "pulse",
      "residents",
      "notices_send",
      "access",
    ],
    housekeeper: ["housekeeping", "maintenance", "calendar"],
    hk_director: ["housekeeping", "hk_assign", "maintenance", "calendar", "pulse", "notices_send"],
    nurse_station: ["dining", "dining_order", "maintenance", "calendar", "residents"],
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
      "pulse",
      "residents",
      "notices_send",
    ],
    maintenance: ["maintenance", "maintenance_crew", "calendar"],
    activities: ["calendar", "attendance", "maintenance", "residents"],
  };
}

export function moduleForHref(path: string): ModuleId | null {
  const href = path === "/app" ? "/" : path.startsWith("/app/") ? path.slice(4) : path;
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
  if (href === "/pulse") return "pulse";
  if (href.startsWith("/residents")) return "residents";
  if (href === "/access") return "access";
  return null;
}

export function roleHas(access: AccessMap, role: Role, moduleId: ModuleId) {
  if (role === "ops_manager") return true;
  return access[role]?.includes(moduleId) ?? false;
}

export function roleCanOpen(access: AccessMap, role: Role, href: string) {
  if (href === "/" || href === "/app") return true;
  const mod = moduleForHref(href.split("?")[0]);
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
  { id: "ops_manager", label: "Operations", hint: "Baker. Everything.", icon: "fa-user-shield", tone: "teal" },
  { id: "housekeeper", label: "Housekeeping", hint: "Their rooms, checklists, timer", icon: "fa-broom", tone: "amber" },
  { id: "hk_director", label: "HK director", hint: "Assign rooms and deep cleans", icon: "fa-clipboard-list", tone: "indigo" },
  { id: "nurse_station", label: "Nurse station", hint: "Take meal orders", icon: "fa-bell-concierge", tone: "sky" },
  { id: "kitchen", label: "Kitchen", hint: "Queue, menus, temps", icon: "fa-fire-burner", tone: "emerald" },
  { id: "dining_manager", label: "Dining manager", hint: "Menus, survey, counts", icon: "fa-chart-pie", tone: "rose" },
  { id: "maintenance", label: "Maintenance", hint: "Work requests to done", icon: "fa-screwdriver-wrench", tone: "slate" },
  { id: "activities", label: "Activities", hint: "Calendar and attendance", icon: "fa-people-group", tone: "sky" },
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

export function peopleInBox<T extends { role: Role | null }>(employees: T[], box: RoleBoxId): T[] {
  return employees.filter((person) =>
    box === "unassigned" ? person.role === null : person.role === box,
  );
}

export function employeeName(employees: EmployeeAccount[], id: string | null) {
  if (!id) return "Unassigned";
  const email = employees.find((e) => e.id === id)?.email;
  return email ? email.split("@")[0] : "Unknown";
}

export function handle(email: string) {
  return email.split("@")[0];
}

export type AppLink = {
  href: string;
  label: string;
  hint: string;
  icon: string;
  tone: LinkTone;
};

export const DEPARTMENT_LINKS: (AppLink & { department?: Department })[] = [
  { href: "/rooms", label: "Rooms", hint: "Check in and check out", icon: "fa-door-open", tone: "teal" },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    hint: "Rooms, checklists, timers and deep cleans.",
    icon: "fa-house",
    tone: "amber",
    department: "housekeeping",
  },
  {
    href: "/dining",
    label: "Dining",
    hint: "Menus, resident orders and the kitchen.",
    icon: "fa-utensils",
    tone: "emerald",
    department: "dining",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    hint: "One shared queue for every repair.",
    icon: "fa-screwdriver-wrench",
    tone: "slate",
    department: "maintenance",
  },
  {
    href: "/calendar",
    label: "Activities",
    hint: "Calendar by building and attendance.",
    icon: "fa-calendar-days",
    tone: "sky",
    department: "activities",
  },
];

export const INSIGHT_LINKS: AppLink[] = [
  { href: "/pulse", label: "Weekly pulse", hint: "Where work gets stuck", icon: "fa-wave-square", tone: "rose" },
  { href: "/calendar", label: "Calendar", hint: "The week, by department", icon: "fa-calendar", tone: "sky" },
  { href: "/residents", label: "Residents", hint: "Rooms that need a visit", icon: "fa-user-group", tone: "indigo" },
];

export const ADMIN_LINKS: AppLink[] = [
  { href: "/access", label: "Access", hint: "Who can open what", icon: "fa-user-lock", tone: "indigo" },
];

export const DINING_LINKS: AppLink[] = [
  { href: "/dining/order", label: "Take order", hint: "Dine in or to-go tray", icon: "fa-utensils", tone: "emerald" },
  { href: "/dining/kitchen", label: "Kitchen queue", hint: "Incoming and special orders", icon: "fa-fire-burner", tone: "amber" },
  { href: "/dining/menus", label: "Menus", hint: "Upload and edit by meal", icon: "fa-book-open", tone: "teal" },
  { href: "/dining/temps", label: "Fridge temps", hint: "Shift log", icon: "fa-temperature-half", tone: "sky" },
  { href: "/dining/checklist", label: "Checklist", hint: "End of shift", icon: "fa-clipboard-check", tone: "indigo" },
  { href: "/dining/survey", label: "Meal survey", hint: "Thumbs up or down", icon: "fa-thumbs-up", tone: "rose" },
  { href: "/dining/manager", label: "Dining counts", hint: "How meals went", icon: "fa-chart-pie", tone: "teal" },
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
          (job) => job.roomNumber === room.number && job.kind === "routine" && job.dueOn === today,
        ),
    )
    .map((room) => ({
      id: `j-${room.number}-${today}`,
      roomNumber: room.number,
      kind: "routine",
      dueOn: today,
      createdAt: now,
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

function menuImage(title: string, dishes: string[]) {
  const lines = dishes
    .map((d, i) => `<text x="40" y="${150 + i * 44}" font-size="26" fill="#2f2a22">${d}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f6f1e9"/><text x="40" y="80" font-family="Georgia" font-size="40" fill="#243d2b">${title}</text><line x1="40" y1="100" x2="560" y2="100" stroke="#a89c88"/>${lines}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const REPAIR_TITLES = [
  "Running toilet",
  "Blind cord broken",
  "Closet door off track",
  "Outlet not working",
  "Heater rattles",
  "Loose grab bar",
  "Window sticks",
  "Light flickers",
];

const ACTIVITY_TITLES = ["Chair yoga", "Bingo", "Coffee social", "Movie night", "Garden club", "Trivia"];

export function seedState(now = Date.now()): AppState {
  const rand = random(24);
  const today = dateKey(now);
  const yesterday = dateKey(addDays(new Date(now), -1));
  const wd = new Date(now).getDay();
  const day = (offset: number) => (wd + offset) % 7;
  const occupiedRooms = ["101", "106", "107", "110"];

  const room = (
    number: string,
    building: string,
    occupancy: Room["occupancy"],
    assignedTo: string,
    cleanDays: number[],
  ): Room => ({ number, building, occupancy, assignedTo, cleanDays });

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

  const job = (input: Partial<CleanJob> & Pick<CleanJob, "id" | "roomNumber" | "kind" | "dueOn">): CleanJob => ({
    createdAt: now,
    assignedTo: null,
    status: "not_started",
    startedAt: null,
    finishedAt: null,
    checked: [],
    notes: [],
    ...input,
  });

  // ---- History: the last 30 days, busier and slower this week so the pulse has something to say.
  const historyJobs: CleanJob[] = [];
  const historyRepairs: MaintenanceRequest[] = [];
  const historyOrders: MealOrder[] = [];
  const historyEvents: CalendarEvent[] = [];
  const crewIds = ["e-maint", "e-maint2"];
  const staffEmails = ["housekeeping@homestead.demo", "station@homestead.demo", "housekeeping2@homestead.demo"];

  for (let d = 1; d <= 30; d += 1) {
    const thisWeek = d <= 7;
    const on = dateKey(addDays(new Date(now), -d));
    // Routine cleans: 3 a day.
    for (let i = 0; i < 3; i += 1) {
      const roomNumber = occupiedRooms[(d + i) % occupiedRooms.length];
      const start = atHour(now, -d, 9 + i, 10);
      const length = roomNumber === "110" && d === 1 ? 34 : 18 + Math.round(rand() * 8);
      historyJobs.push(
        job({
          id: `j-h-${d}-${i}`,
          roomNumber,
          kind: "routine",
          dueOn: on,
          createdAt: atHour(now, -d, 6),
          assignedTo: roomNumber === "107" || roomNumber === "110" ? "e-hk2" : "e-hk",
          status: "done",
          startedAt: start,
          finishedAt: start + minutes(length),
          checked: routineChecklist.map((c) => c.id),
        }),
      );
    }
    // Move-out deep cleans every 6 days.
    if (d % 6 === 2 || d === 5) {
      const moveOut = atHour(now, -d, 10);
      const wait = thisWeek ? hours(66 + rand() * 8) : hours(20 + rand() * 10);
      const start = moveOut + wait;
      historyJobs.push(
        job({
          id: `j-hd-${d}`,
          roomNumber: ["103", "105", "111"][d % 3],
          kind: "deep",
          dueOn: dateKey(moveOut),
          createdAt: moveOut,
          assignedTo: "e-hk",
          status: "done",
          startedAt: start,
          finishedAt: start + minutes(80 + Math.round(rand() * 20)),
          checked: deepChecklist.map((c) => c.id),
        }),
      );
    }
    // Repairs every 2 days: this week they sit for a long time before anyone is assigned.
    if (d % 2 === 1) {
      const created = atHour(now, -d, 9);
      const seen = created + hours(thisWeek ? 9 : 2 + rand() * 2);
      const assigned = seen + hours(thisWeek ? 34 : 3 + rand() * 3);
      const fixed = assigned + hours(4 + rand() * 3);
      historyRepairs.push({
        id: `m-h-${d}`,
        title: REPAIR_TITLES[d % REPAIR_TITLES.length],
        roomNumber: ["101", "103", "106", "107", "110"][d % 5],
        area: "",
        details: "",
        photos: [],
        priority: "routine",
        status: "done",
        createdAt: created,
        createdBy: staffEmails[d % staffEmails.length],
        assignedTo: crewIds[d % 2],
        seenAt: seen,
        assignedAt: assigned,
        fixedAt: fixed,
        cleanJobId: null,
        updates: [
          {
            id: `mu-h-${d}`,
            status: "done",
            note: "Fixed.",
            at: fixed,
            by: "maintenance@homestead.demo",
          },
        ],
      });
    }
    // Meals: lunch for every occupied room. Room 107 moved to to-go trays this week.
    for (const roomNumber of occupiedRooms) {
      const type = roomNumber === "107" ? (thisWeek ? "to_go" : "dine_in") : d % 3 === 0 ? "to_go" : "dine_in";
      const created = atHour(now, -d, 11, 30 + Math.round(rand() * 20));
      const startedAt = created + minutes(3 + Math.round(rand() * 3));
      const readyAt = startedAt + minutes(10 + Math.round(rand() * 6));
      const pickup =
        type === "to_go"
          ? thisWeek
            ? roomNumber === "107"
              ? 14 + Math.round(rand() * 6)
              : 5 + Math.round(rand() * 4)
            : 3 + Math.round(rand() * 3)
          : 2;
      historyOrders.push({
        id: `o-h-${d}-${roomNumber}`,
        roomNumber,
        meal: "lunch",
        itemId: ["l-turkey", "l-soup", "l-salad"][(d + Number(roomNumber)) % 3],
        special: "",
        type,
        status: "complete",
        createdAt: created,
        startedAt,
        readyAt,
        completedAt: readyAt + minutes(pickup),
        placedBy: "station@homestead.demo",
        stationId: "station-2",
      });
    }
    // One activity a day. Attendance gets written up late this week.
    const startsAt = atHour(now, -d, d % 2 ? 10 : 14);
    const attendees = occupiedRooms.filter((r) => {
      if (r === "110") return !thisWeek && d % 2 === 1;
      if (r === "107") return !thisWeek && d % 3 !== 0;
      return d % 2 === 0;
    });
    historyEvents.push({
      id: `ev-h-${d}`,
      title: ACTIVITY_TITLES[d % ACTIVITY_TITLES.length],
      kind: "activity",
      startsAt,
      allDay: false,
      building: ["Building A", "Building B", "Building C"][d % 3],
      place: "",
      roomNumber: null,
      attendance: attendees,
      attendanceAt: startsAt + hours(thisWeek ? 5 + rand() * 2 : 1 + rand()),
    });
  }

  // ---- Room feedback: what residents said, by room.
  const fb = (
    daysAgo: number,
    roomNumber: string,
    department: Department,
    kind: RoomFeedback["kind"],
    topic: FeedbackTopic,
    text: string,
  ): RoomFeedback => ({
    id: `rf-${daysAgo}-${roomNumber}-${topic}-${kind}-${text.length}`,
    roomNumber,
    department,
    kind,
    topic,
    text,
    at: daysAgo === 0 ? now - hours(2) : atHour(now, -daysAgo, 12, 55),
    by: "station@homestead.demo",
  });
  const roomFeedback: RoomFeedback[] = [
    fb(0, "107", "dining", "complaint", "food_temperature", "Lunch was cold again by the time the tray got to me."),
    fb(1, "101", "maintenance", "complaint", "repairs_slow", "Still waiting on someone to look at my sink."),
    fb(2, "107", "dining", "complaint", "food_temperature", "Soup was cold."),
    fb(3, "107", "dining", "complaint", "food_temperature", "Tray came late and cold."),
    fb(1, "110", "dining", "complaint", "food_temperature", "Coffee was lukewarm."),
    fb(4, "106", "dining", "complaint", "food_temperature", "Eggs were cold."),
    fb(2, "106", "maintenance", "complaint", "repairs_slow", "Blind still broken."),
    fb(5, "110", "maintenance", "complaint", "repairs_slow", "Heater still rattles."),
    fb(3, "101", "housekeeping", "complaint", "room_cleanliness", "Bathroom was missed."),
    fb(4, "110", "housekeeping", "complaint", "room_cleanliness", "Floor not mopped."),
    fb(2, "110", "activities", "complaint", "noise", "Loud hallway after 10."),
    fb(5, "106", "activities", "complaint", "noise", "Door slamming at night."),
    fb(6, "110", "activities", "complaint", "activity_variety", "Same games every week."),
    fb(1, "101", "dining", "compliment", "food_taste", "Loved the chicken."),
    fb(1, "106", "activities", "compliment", "activity_variety", "Music was great."),
    fb(2, "101", "housekeeping", "compliment", "room_cleanliness", "Room looks great."),
    fb(3, "106", "dining", "compliment", "food_taste", "Great soup."),
    fb(3, "110", "housekeeping", "compliment", "staff_response", "Housekeeper was so kind."),
    fb(4, "101", "activities", "compliment", "activity_variety", "Enjoyed trivia."),
    fb(5, "107", "housekeeping", "compliment", "room_cleanliness", "Fresh linens, thank you."),
    fb(5, "106", "maintenance", "compliment", "staff_response", "Fixed my light fast."),
    fb(6, "101", "dining", "compliment", "food_taste", "Pie was wonderful."),
    fb(9, "107", "dining", "complaint", "food_temperature", "A bit cold."),
    fb(10, "101", "dining", "complaint", "food_temperature", "Toast cold."),
    fb(9, "110", "maintenance", "complaint", "repairs_slow", "Faucet still drips."),
    fb(11, "106", "maintenance", "complaint", "repairs_slow", "Waiting on outlet."),
    fb(8, "106", "housekeeping", "complaint", "room_cleanliness", "Dust on shelves."),
    fb(12, "110", "housekeeping", "complaint", "room_cleanliness", "Trash not emptied."),
    fb(10, "110", "activities", "complaint", "activity_variety", "Want more outings."),
    fb(13, "101", "activities", "complaint", "activity_variety", "More music please."),
    fb(8, "107", "activities", "compliment", "activity_variety", "Loved chair yoga."),
  ];

  // ---- Staffing for the week around today.
  const needed: Record<Department, number> = { housekeeping: 4, dining: 6, maintenance: 2, activities: 1 };
  const staffing: StaffingDay[] = [];
  for (let d = -1; d <= 7; d += 1) {
    const on = dateKey(addDays(new Date(now), d));
    for (const department of Object.keys(needed) as Department[]) {
      let scheduled = needed[department];
      if (d === 1 && department === "dining") scheduled = 5;
      if (d === 2 && department === "housekeeping") scheduled = 2;
      staffing.push({ on, department, needed: needed[department], scheduled });
    }
  }

  const event = (
    input: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "kind" | "startsAt">,
  ): CalendarEvent => ({
    allDay: false,
    building: null,
    place: "",
    roomNumber: null,
    attendance: [],
    attendanceAt: null,
    ...input,
  });

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
      { id: "e-maint2", email: "maintenance2@homestead.demo", role: "maintenance" },
      { id: "e-act", email: "activities@homestead.demo", role: "activities" },
      { id: "e-new-1", email: "new.hire@homestead.demo", role: null },
      { id: "e-new-2", email: "float@homestead.demo", role: null },
    ],
    access: defaultAccess(),
    rooms: [
      room("101", "Building A", "occupied", "e-hk", [day(0), day(3)]),
      room("102", "Building A", "needs_cleaning", "e-hk", [day(1), day(4)]),
      room("103", "Building A", "vacant", "e-hk", [day(2), day(5)]),
      room("104", "Building A", "needs_cleaning", "e-hk", [day(1), day(4)]),
      room("105", "Building B", "vacant", "e-hk", [day(2), day(5)]),
      room("106", "Building B", "occupied", "e-hk", [day(0), day(3)]),
      room("107", "Building B", "occupied", "e-hk2", [day(0), day(4)]),
      room("108", "Building B", "needs_cleaning", "e-hk2", [day(1), day(4)]),
      room("109", "Building C", "needs_cleaning", "e-hk2", [day(2), day(5)]),
      room("110", "Building C", "occupied", "e-hk2", [day(1), day(5)]),
      room("111", "Building C", "vacant", "e-hk2", [day(2), day(6)]),
      room("112", "Building C", "vacant", "e-hk2", [day(3), day(6)]),
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
        startsOn: dateKey(addDays(new Date(now), -40)),
        endsOn: today,
        checkedInAt: now - hours(40 * 24),
        checkedOutAt: null,
      },
      {
        id: "s-107",
        roomNumber: "107",
        startsOn: dateKey(addDays(new Date(now), -60)),
        endsOn: dateKey(addDays(new Date(now), 30)),
        checkedInAt: now - hours(60 * 24),
        checkedOutAt: null,
      },
      {
        id: "s-110",
        roomNumber: "110",
        startsOn: dateKey(addDays(new Date(now), -30)),
        endsOn: dateKey(addDays(new Date(now), 20)),
        checkedInAt: now - hours(30 * 24),
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
      job({
        id: "j-106-today",
        roomNumber: "106",
        kind: "routine",
        dueOn: today,
        assignedTo: "e-hk",
        status: "done",
        startedAt: now - minutes(120),
        finishedAt: now - minutes(99),
        checked: routineChecklist.map((i) => i.id),
      }),
      job({
        id: "j-107-today",
        roomNumber: "107",
        kind: "routine",
        dueOn: today,
        assignedTo: "e-hk2",
        status: "in_progress",
        startedAt: now - minutes(38),
        checked: ["r-bed", "r-trash"],
      }),
      job({
        id: "j-102-deep",
        roomNumber: "102",
        kind: "deep",
        dueOn: today,
        createdAt: now - minutes(20),
        assignedTo: "e-hk",
        status: "in_progress",
        startedAt: now - minutes(8),
        checked: ["d-bed", "d-closet"],
      }),
      job({ id: "j-104-deep", roomNumber: "104", kind: "deep", dueOn: today, createdAt: now - hours(26) }),
      job({
        id: "j-108-deep",
        roomNumber: "108",
        kind: "deep",
        dueOn: today,
        createdAt: now - hours(5),
        assignedTo: "e-hk2",
      }),
      job({
        id: "j-109-deep",
        roomNumber: "109",
        kind: "deep",
        dueOn: today,
        createdAt: now - hours(40),
        assignedTo: "e-hk2",
        status: "in_progress",
        startedAt: now - minutes(14),
        checked: ["d-bed"],
      }),
      job({
        id: "j-110-yday",
        roomNumber: "110",
        kind: "routine",
        dueOn: yesterday,
        assignedTo: "e-hk2",
        status: "done",
        startedAt: now - hours(25),
        finishedAt: now - hours(25) + minutes(41),
        checked: routineChecklist.map((i) => i.id),
        notes: [
          {
            id: "n-1",
            text: "Extra towels left on the chair.",
            at: now - hours(25) + minutes(20),
            by: "housekeeping2@homestead.demo",
          },
        ],
      }),
      ...historyJobs,
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
    menuFiles: [
      {
        meal: "lunch",
        fileName: "lunch-menu.svg",
        kind: "image",
        dataUrl: menuImage("Lunch", ["Turkey sandwich", "Tomato soup", "Garden salad"]),
        uploadedAt: now - hours(30),
      },
    ],
    orders: [
      {
        id: "o-1",
        roomNumber: "107",
        meal: "lunch",
        itemId: "l-turkey",
        special: "",
        type: "to_go",
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
        roomNumber: "107",
        meal: "lunch",
        itemId: "l-salad",
        special: "",
        type: "to_go",
        status: "ready",
        createdAt: now - minutes(40),
        startedAt: now - minutes(34),
        readyAt: now - minutes(18),
        completedAt: null,
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
      ...historyOrders,
    ],
    fridges: [
      { id: "fridge-a", label: "Kitchen fridge A" },
      { id: "fridge-b", label: "Kitchen fridge B" },
    ],
    temps: [{ id: "temp-1", fridgeId: "fridge-a", tempF: 38, recordedAt: now - minutes(95), stationId: "kitchen-am" }],
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
        title: "Leaking sink",
        roomNumber: "101",
        area: "",
        details: "Water pools under the cabinet.",
        photos: [],
        priority: "urgent",
        status: "open",
        createdAt: now - hours(49),
        createdBy: "housekeeping@homestead.demo",
        assignedTo: null,
        seenAt: now - hours(40),
        assignedAt: null,
        fixedAt: null,
        cleanJobId: null,
        updates: [],
      },
      {
        id: "m-2",
        title: "Hallway light out",
        roomNumber: null,
        area: "2nd floor hallway, Building B",
        details: "Second fixture from the elevator.",
        photos: [],
        priority: "routine",
        status: "in_progress",
        createdAt: now - hours(6),
        createdBy: "station@homestead.demo",
        assignedTo: "e-maint",
        seenAt: now - hours(5),
        assignedAt: now - hours(4),
        fixedAt: null,
        cleanJobId: null,
        updates: [
          {
            id: "mu-1",
            status: "in_progress",
            note: "Bulb ordered, ladder on the way.",
            at: now - hours(4),
            by: "maintenance@homestead.demo",
          },
        ],
      },
      {
        id: "m-3",
        title: "Heater rattles",
        roomNumber: "110",
        area: "",
        details: "",
        photos: [],
        priority: "routine",
        status: "open",
        createdAt: now - hours(3),
        createdBy: "housekeeping2@homestead.demo",
        assignedTo: null,
        seenAt: null,
        assignedAt: null,
        fixedAt: null,
        cleanJobId: null,
        updates: [],
      },
      ...historyRepairs,
    ],
    notices: [
      {
        id: "nt-1",
        at: now - hours(26),
        title: "Room 104 needs a deep clean",
        body: "Checked out. Pick a housekeeper for the deep clean.",
        href: "/housekeeping/assign",
        toRoles: ["hk_director"],
        toEmails: [],
        readBy: [],
      },
      {
        id: "nt-2",
        at: now - hours(49),
        title: "Urgent request: Leaking sink",
        body: "Room 101 · from housekeeping@homestead.demo",
        href: "/maintenance",
        toRoles: ["maintenance"],
        toEmails: [],
        readBy: [],
      },
    ],
    buildings: ["Building A", "Building B", "Building C"],
    events: [
      event({
        id: "ev-bingo",
        title: "Bingo",
        kind: "activity",
        startsAt: atHour(now, 0, 14),
        building: "Building A",
        attendance: ["101", "106"],
        attendanceAt: atHour(now, 0, 15),
      }),
      event({ id: "ev-yoga", title: "Chair yoga", kind: "activity", startsAt: atHour(now, 0, 10), building: "Building B" }),
      event({
        id: "ev-birthday",
        title: "Birthday lunch",
        kind: "dining",
        startsAt: atHour(now, 1, 11),
        building: "Building A",
        place: "Dining room",
      }),
      event({
        id: "ev-handrail",
        title: "Handrail repair",
        kind: "maintenance",
        startsAt: atHour(now, 1, 14),
        building: "Building A",
        roomNumber: "103",
      }),
      event({
        id: "ev-family",
        title: "Family visiting day",
        kind: "activity",
        startsAt: atHour(now, 2, 0),
        allDay: true,
        building: "Building A",
      }),
      event({
        id: "ev-filter",
        title: "Hallway filter check",
        kind: "maintenance",
        startsAt: atHour(now, 2, 9),
        building: "Building B",
      }),
      event({ id: "ev-music", title: "Live music", kind: "activity", startsAt: atHour(now, 3, 10), building: "Building B" }),
      event({
        id: "ev-brunch",
        title: "Sunday brunch",
        kind: "dining",
        startsAt: atHour(now, 3, 11),
        building: "Building A",
        place: "Dining room",
      }),
      event({ id: "ev-coffee", title: "Coffee social", kind: "activity", startsAt: atHour(now, 4, 9, 40), building: "Building A" }),
      event({
        id: "ev-alarm",
        title: "Fire alarm test",
        kind: "maintenance",
        startsAt: atHour(now, 4, 14),
        building: "Building A",
      }),
      event({ id: "ev-hvac", title: "HVAC filters", kind: "maintenance", startsAt: atHour(now, 5, 13), building: "Building C" }),
      event({ id: "ev-garden", title: "Garden club", kind: "activity", startsAt: atHour(now, 5, 11, 30), building: "Building A" }),
      event({ id: "ev-menu", title: "Post next week's menu", kind: "dining", startsAt: atHour(now, 6, 15) }),
      ...historyEvents,
    ],
    roomFeedback,
    visits: [],
    staffing,
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
