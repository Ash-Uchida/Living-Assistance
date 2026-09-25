import { addDays, dateKey, parseDateKey } from "./dates";
import { FEEDBACK_TOPIC_LABEL, MEAL_LABEL, formatSpan, formatTime } from "./format";
import { DEPARTMENT_LABEL, employeeName, handle, roleHas } from "./seed";
import type {
  AppState,
  CleanJob,
  Department,
  EventKind,
  FeedbackTopic,
  Meal,
  ModuleId,
  RoomFeedback,
} from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const EVENT_DEPARTMENT: Record<EventKind, Department> = {
  activity: "activities",
  dining: "dining",
  maintenance: "maintenance",
  housekeeping: "housekeeping",
};

export const DEPARTMENT_DOT: Record<Department, string> = {
  housekeeping: "bg-teal-600",
  dining: "bg-amber-500",
  maintenance: "bg-sky-600",
  activities: "bg-violet-500",
};

export const DEPARTMENT_CHIP: Record<Department, string> = {
  housekeeping: "bg-teal-50 text-teal-900",
  dining: "bg-amber-50 text-amber-900",
  maintenance: "bg-sky-50 text-sky-900",
  activities: "bg-violet-50 text-violet-900",
};

// ---------------------------------------------------------------- Today

export type ProblemAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "alert"; label: string; orderId: string };

export type Problem = {
  id: string;
  level: "urgent" | "watch";
  department: Department;
  title: string;
  detail: string;
  action: ProblemAction;
  since: number;
};

const TRAY_WAIT_LIMIT = 10 * MIN;

function jobTarget(state: AppState, job: CleanJob) {
  return state.cleanTargets[job.kind] * MIN;
}

/** Everything that needs a person right now, limited to what this job can open. */
export function problemsFor(state: AppState, now: number): Problem[] {
  const can = (m: ModuleId) => roleHas(state.access, state.role, m);
  const meId = state.employees.find((e) => e.email === state.signedInEmail)?.id;
  const today = dateKey(now);
  const out: Problem[] = [];

  if (can("housekeeping")) {
    for (const job of state.cleanJobs) {
      if (job.status !== "in_progress" || !job.startedAt) continue;
      if (state.role === "housekeeper" && job.assignedTo !== meId) continue;
      const over = now - job.startedAt - jobTarget(state, job);
      if (over <= 0) continue;
      out.push({
        id: `over-${job.id}`,
        level: "urgent",
        department: "housekeeping",
        title: `Room ${job.roomNumber} is ${formatSpan(over)} over time`,
        detail: `${employeeName(state.employees, job.assignedTo)} · since ${formatTime(job.startedAt)}`,
        action: { kind: "link", label: "Check on it", href: `/housekeeping/clean/${job.id}` },
        since: job.startedAt,
      });
    }
  }

  if (can("maintenance")) {
    for (const m of state.maintenance) {
      if (m.status === "done" || m.assignedTo) continue;
      const age = now - m.createdAt;
      if (m.priority !== "urgent" && age < DAY) continue;
      const where = m.roomNumber ? `Room ${m.roomNumber}` : m.area;
      out.push({
        id: `repair-${m.id}`,
        level: m.priority === "urgent" ? "urgent" : "watch",
        department: "maintenance",
        title: `${m.title}, ${where}`,
        detail: `${formatSpan(age)} · unassigned`,
        action: {
          kind: "link",
          label: can("maintenance_crew") ? "Assign" : "View",
          href: `/maintenance#${m.id}`,
        },
        since: m.createdAt,
      });
    }
  }

  if (can("dining_order") || can("dining_kitchen")) {
    for (const o of state.orders) {
      if (o.status !== "ready" || !o.readyAt) continue;
      const wait = now - o.readyAt;
      if (wait < TRAY_WAIT_LIMIT) continue;
      out.push({
        id: `tray-${o.id}`,
        level: "urgent",
        department: "dining",
        title: `${o.type === "to_go" ? "To-go tray" : "Dine-in meal"} waiting, Room ${o.roomNumber}`,
        detail: `Ready ${formatSpan(wait)} ago`,
        action: { kind: "alert", label: "Alert station", orderId: o.id },
        since: o.readyAt,
      });
    }
  }

  if (can("hk_assign")) {
    for (const job of state.cleanJobs) {
      if (job.kind !== "deep" || job.status === "done" || job.assignedTo) continue;
      out.push({
        id: `deep-${job.id}`,
        level: "watch",
        department: "housekeeping",
        title: `Deep clean, Room ${job.roomNumber}`,
        detail: "Needs a staff member",
        action: { kind: "link", label: "Assign", href: "/housekeeping/assign" },
        since: job.createdAt,
      });
    }
  }

  if (can("dining_menus")) {
    const missing = (Object.keys(MEAL_LABEL) as Meal[]).filter(
      (meal) => !state.menuFiles.some((f) => f.meal === meal),
    );
    for (const meal of missing) {
      out.push({
        id: `menu-${meal}`,
        level: "watch",
        department: "dining",
        title: `${MEAL_LABEL[meal]} menu missing`,
        detail: "Residents and staff can't see it",
        action: { kind: "link", label: "Upload", href: "/dining/menus" },
        since: now,
      });
    }
  }

  if (can("attendance")) {
    for (const e of state.events) {
      if (e.kind !== "activity" || e.allDay || e.attendanceAt) continue;
      if (dateKey(e.startsAt) !== today || now - e.startsAt < HOUR) continue;
      out.push({
        id: `att-${e.id}`,
        level: "watch",
        department: "activities",
        title: `Attendance not taken: ${e.title}`,
        detail: `${formatTime(e.startsAt)}${e.building ? ` · ${e.building}` : ""}`,
        action: { kind: "link", label: "Take it", href: `/calendar?day=${today}&event=${e.id}` },
        since: e.startsAt,
      });
    }
  }

  if (can("pulse")) {
    const tomorrow = dateKey(addDays(new Date(now), 1));
    for (const s of state.staffing) {
      if ((s.on !== today && s.on !== tomorrow) || s.scheduled >= s.needed) continue;
      out.push({
        id: `staff-${s.on}-${s.department}`,
        level: "watch",
        department: s.department,
        title: `${DEPARTMENT_LABEL[s.department]} is ${s.needed - s.scheduled} short ${s.on === today ? "today" : "tomorrow"}`,
        detail: `${s.scheduled} of ${s.needed} scheduled`,
        action: { kind: "link", label: "See day", href: `/calendar?day=${s.on}` },
        since: now,
      });
    }
  }

  if (can("residents")) {
    for (const v of state.visits) {
      if (v.doneAt || v.on > today) continue;
      out.push({
        id: `visit-${v.id}`,
        level: "watch",
        department: "activities",
        title: `Visit Room ${v.roomNumber}`,
        detail: v.reason,
        action: { kind: "link", label: "Open", href: `/residents/${v.roomNumber}` },
        since: now,
      });
    }
  }

  return out.sort((a, b) =>
    a.level === b.level ? a.since - b.since : a.level === "urgent" ? -1 : 1,
  );
}

// ---------------------------------------------------------------- Weekly pulse

export type Period = "week" | "month";

export function periodRange(period: Period, now: number) {
  const days = period === "week" ? 7 : 30;
  return { from: now - days * DAY, to: now, prevFrom: now - 2 * days * DAY };
}

export type Stage = { label: string; avg: number | null };

export type PulseRow = {
  id: string;
  label: string;
  summary: string;
  targetLabel: string;
  ratio: number | null;
  previousRatio: number | null;
  count: number;
  stages: Stage[];
  tip: string;
  module: ModuleId;
};

export function pulseStatus(ratio: number | null) {
  if (ratio === null) return "no_data" as const;
  if (ratio >= 1.5) return "bottleneck" as const;
  if (ratio > 1.1) return "watch" as const;
  return "on_track" as const;
}

function avg(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function inRange(ts: number, from: number, to: number) {
  return ts >= from && ts < to;
}

type Measure = {
  id: string;
  label: string;
  module: ModuleId;
  target: number;
  targetLabel: string;
  summary: (value: number) => string;
  /** Returns [total, ...stage values] per item in range. */
  samples: (from: number, to: number) => { total: number; stages: (number | null)[] }[];
  stageLabels: string[];
  tip: (stages: Stage[]) => string;
};

function biggest(stages: Stage[]) {
  return stages.reduce<Stage | null>(
    (best, s) => (s.avg !== null && (!best || (best.avg ?? 0) < s.avg) ? s : best),
    null,
  );
}

export function pulseRows(state: AppState, period: Period, now: number): PulseRow[] {
  const { from, to, prevFrom } = periodRange(period, now);
  const routineTarget = state.cleanTargets.routine * MIN;

  const measures: Measure[] = [
    {
      id: "repairs",
      label: "Repair requests",
      module: "maintenance",
      target: 4 * HOUR,
      targetLabel: "assigned within 4 hours",
      summary: (v) => `Avg ${formatSpan(v)} to assign`,
      stageLabels: ["Submitted → seen", "Seen → assigned", "Assigned → fixed"],
      samples: (f, t) =>
        state.maintenance
          .filter((m) => m.assignedAt && inRange(m.createdAt, f, t))
          .map((m) => ({
            total: (m.assignedAt ?? 0) - m.createdAt,
            stages: [
              m.seenAt ? m.seenAt - m.createdAt : null,
              m.seenAt && m.assignedAt ? m.assignedAt - m.seenAt : null,
              m.fixedAt && m.assignedAt ? m.fixedAt - m.assignedAt : null,
            ],
          })),
      tip: (stages) =>
        biggest(stages.slice(0, 2))?.label === "Submitted → seen"
          ? "Requests sit unread. Turn on alerts for the maintenance crew and check the queue at the start of every shift."
          : "Most of the wait happens after someone has seen the request but before anyone is assigned. Send new requests straight to the crew member who covers that building.",
    },
    {
      id: "deep",
      label: "Move-out deep cleans",
      module: "housekeeping",
      target: DAY,
      targetLabel: "started within 1 day",
      summary: (v) => `Started ${formatSpan(v)} after move-out`,
      stageLabels: ["Move-out → started", "Started → finished"],
      samples: (f, t) =>
        state.cleanJobs
          .filter((j) => j.kind === "deep" && j.startedAt && inRange(j.createdAt, f, t))
          .map((j) => ({
            total: (j.startedAt ?? 0) - j.createdAt,
            stages: [(j.startedAt ?? 0) - j.createdAt, j.finishedAt ? j.finishedAt - (j.startedAt ?? 0) : null],
          })),
      tip: () =>
        "The clean itself is quick; the wait is before it starts. Assign the deep clean the day the room checks out. Unassigned ones show on Today.",
    },
    {
      id: "attendance",
      label: "Attendance recorded",
      module: "calendar",
      target: 2 * HOUR,
      targetLabel: "recorded within 2 hours",
      summary: (v) => `${formatSpan(v)} after activity`,
      stageLabels: ["Activity → recorded"],
      samples: (f, t) =>
        state.events
          .filter((e) => e.kind === "activity" && !e.allDay && e.attendanceAt && inRange(e.startsAt, f, t))
          .map((e) => ({ total: (e.attendanceAt ?? 0) - e.startsAt, stages: [(e.attendanceAt ?? 0) - e.startsAt] })),
      tip: () => "Tap attendance on a phone during the activity instead of writing it up at the end of the day.",
    },
    {
      id: "trays",
      label: "To-go trays",
      module: "dining",
      target: 5 * MIN,
      targetLabel: "picked up within 5 min",
      summary: (v) => `Waited ${formatSpan(v)} after ready`,
      stageLabels: ["Order → ready", "Ready → picked up"],
      samples: (f, t) =>
        state.orders
          .filter((o) => o.type === "to_go" && o.readyAt && o.completedAt && inRange(o.createdAt, f, t))
          .map((o) => ({
            total: (o.completedAt ?? 0) - (o.readyAt ?? 0),
            stages: [(o.readyAt ?? 0) - o.createdAt, (o.completedAt ?? 0) - (o.readyAt ?? 0)],
          })),
      tip: () =>
        "Trays are ready on time but sit at the kitchen. Use Alert station on Today to ping the nurse station again, and name a tray runner at lunch.",
    },
    {
      id: "cleans",
      label: "Room cleans",
      module: "housekeeping",
      target: routineTarget,
      targetLabel: `${state.cleanTargets.routine} min per room`,
      summary: (v) => `Avg ${formatSpan(v)} per room`,
      stageLabels: ["Started → finished"],
      samples: (f, t) =>
        state.cleanJobs
          .filter((j) => j.kind === "routine" && j.startedAt && j.finishedAt && inRange(j.startedAt, f, t))
          .map((j) => ({ total: (j.finishedAt ?? 0) - (j.startedAt ?? 0), stages: [(j.finishedAt ?? 0) - (j.startedAt ?? 0)] })),
      tip: () => "Open the rooms that run long on Housekeeping and read the notes before changing the target.",
    },
    {
      id: "orders",
      label: "Orders to kitchen",
      module: "dining",
      target: 5 * MIN,
      targetLabel: "started within 5 min",
      summary: (v) => `Avg ${formatSpan(v)} from order to kitchen`,
      stageLabels: ["Sent → started", "Started → ready"],
      samples: (f, t) =>
        state.orders
          .filter((o) => o.startedAt && inRange(o.createdAt, f, t))
          .map((o) => ({
            total: (o.startedAt ?? 0) - o.createdAt,
            stages: [(o.startedAt ?? 0) - o.createdAt, o.readyAt ? o.readyAt - (o.startedAt ?? 0) : null],
          })),
      tip: () => "Orders reach the kitchen quickly. Keep doing what you are doing.",
    },
  ];

  return measures.map((m) => {
    const now = m.samples(from, to);
    const before = m.samples(prevFrom, from);
    const total = avg(now.map((s) => s.total));
    const prevTotal = avg(before.map((s) => s.total));
    const stages = m.stageLabels.map((label, i) => ({
      label,
      avg: avg(now.map((s) => s.stages[i]).filter((v): v is number => v !== null)),
    }));
    return {
      id: m.id,
      label: m.label,
      module: m.module,
      summary: total === null ? "Nothing recorded yet" : `${m.summary(total)} · target ${m.targetLabel}`,
      targetLabel: m.targetLabel,
      ratio: total === null ? null : total / m.target,
      previousRatio: prevTotal === null ? null : prevTotal / m.target,
      count: now.length,
      stages,
      tip: m.tip(stages),
    };
  });
}

export type TopicCount = { topic: FeedbackTopic; label: string; count: number; change: number };

export function feedbackSummary(state: AppState, period: Period, now: number) {
  const { from, to, prevFrom } = periodRange(period, now);
  const current = state.roomFeedback.filter((f) => inRange(f.at, from, to));
  const previous = state.roomFeedback.filter((f) => inRange(f.at, prevFrom, from));
  const complaints = current.filter((f) => f.kind === "complaint");
  const topics = (Object.keys(FEEDBACK_TOPIC_LABEL) as FeedbackTopic[])
    .map((topic) => {
      const count = complaints.filter((f) => f.topic === topic).length;
      const before = previous.filter((f) => f.kind === "complaint" && f.topic === topic).length;
      return { topic, label: FEEDBACK_TOPIC_LABEL[topic], count, change: count - before };
    })
    .filter((t) => t.count > 0 || t.change !== 0)
    .sort((a, b) => b.count - a.count);
  return {
    concerns: complaints.length,
    compliments: current.length - complaints.length,
    topics,
    latest: [...complaints].sort((a, b) => b.at - a.at).slice(0, 2),
  };
}

// ---------------------------------------------------------------- Calendar

export type DayItem = {
  id: string;
  department: Department;
  time: number | null;
  title: string;
  sub: string;
  eventId?: string;
};

export function weekStart(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function routineRoomsOn(state: AppState, key: string) {
  const weekday = parseDateKey(key).getDay();
  const fromJobs = state.cleanJobs.filter((j) => j.kind === "routine" && j.dueOn === key);
  if (fromJobs.length) return fromJobs.length;
  return state.rooms.filter((r) => r.occupancy === "occupied" && r.cleanDays.includes(weekday)).length;
}

export function dayItems(state: AppState, key: string): DayItem[] {
  const items: DayItem[] = [];
  for (const e of state.events) {
    if (dateKey(e.startsAt) !== key) continue;
    const where = [e.roomNumber ? `Room ${e.roomNumber}` : "", e.place, e.building ?? ""]
      .filter(Boolean)
      .join(" · ");
    items.push({
      id: e.id,
      department: EVENT_DEPARTMENT[e.kind],
      time: e.allDay ? null : e.startsAt,
      title: e.title,
      sub: where,
      eventId: e.id,
    });
  }
  const routine = routineRoomsOn(state, key);
  if (routine > 0) {
    items.push({
      id: `routine-${key}`,
      department: "housekeeping",
      time: null,
      title: "Routine cleans",
      sub: `${routine} ${routine === 1 ? "room" : "rooms"}`,
    });
  }
  for (const j of state.cleanJobs) {
    if (j.kind !== "deep" || j.dueOn !== key) continue;
    items.push({
      id: `deep-${j.id}`,
      department: "housekeeping",
      time: null,
      title: `Deep clean · Room ${j.roomNumber}`,
      sub: j.status === "done" ? "Done" : j.assignedTo ? employeeName(state.employees, j.assignedTo) : "Unassigned",
    });
  }
  for (const s of state.stays) {
    if (s.startsOn === key) {
      items.push({ id: `in-${s.id}`, department: "housekeeping", time: null, title: `Room ${s.roomNumber} move-in`, sub: "" });
    }
    const out = s.checkedOutAt ? dateKey(s.checkedOutAt) : s.endsOn;
    if (out === key) {
      items.push({
        id: `out-${s.id}`,
        department: "housekeeping",
        time: s.checkedOutAt,
        title: `Room ${s.roomNumber} move-out`,
        sub: s.checkedOutAt ? "Checked out" : "Planned",
      });
    }
  }
  for (const v of state.visits) {
    if (v.on !== key) continue;
    items.push({
      id: `visit-${v.id}`,
      department: "activities",
      time: null,
      title: `Visit · Room ${v.roomNumber}`,
      sub: v.doneAt ? "Done" : v.reason,
    });
  }
  return items.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export type DayRisk = { id: string; department: Department; text: string; badge: string };

export function dayRisks(state: AppState, key: string, now: number): DayRisk[] {
  const risks: DayRisk[] = [];
  const staffing = state.staffing.filter((s) => s.on === key);
  const short = (d: Department) => {
    const s = staffing.find((x) => x.department === d);
    return s && s.scheduled < s.needed ? s : null;
  };

  const dining = short("dining");
  const bigMeal = state.events.find((e) => {
    if (e.kind !== "dining" || e.allDay || dateKey(e.startsAt) !== key) return false;
    const hour = new Date(e.startsAt).getHours();
    return (hour >= 11 && hour < 14) || (hour >= 17 && hour < 19);
  });
  if (dining) {
    const gap = dining.needed - dining.scheduled;
    risks.push({
      id: `dining-${key}`,
      department: "dining",
      text: bigMeal
        ? `${bigMeal.title} at ${formatTime(bigMeal.startsAt)} brings a bigger crowd to the dining room, and dining is ${gap} short (${dining.scheduled} of ${dining.needed}).`
        : `Dining has ${dining.scheduled} of ${dining.needed} scheduled.`,
      badge: `${gap} server${gap === 1 ? "" : "s"} short`,
    });
  }

  const hk = short("housekeeping");
  if (hk) {
    const rooms =
      routineRoomsOn(state, key) +
      state.cleanJobs.filter((j) => j.kind === "deep" && j.status !== "done" && j.dueOn <= key).length;
    risks.push({
      id: `hk-${key}`,
      department: "housekeeping",
      text: `Only ${hk.scheduled} housekeepers for ${rooms} rooms (${hk.needed} needed).`,
      badge: "Short-staffed",
    });
  }

  for (const d of ["maintenance", "activities"] as Department[]) {
    const s = short(d);
    if (!s) continue;
    risks.push({
      id: `${d}-${key}`,
      department: d,
      text: `${DEPARTMENT_LABEL[d]} has ${s.scheduled} of ${s.needed} scheduled.`,
      badge: "Short-staffed",
    });
  }

  if (key === dateKey(now)) {
    const unassigned = state.cleanJobs.filter(
      (j) => j.kind === "deep" && j.status !== "done" && !j.assignedTo && j.dueOn <= key,
    );
    for (const j of unassigned) {
      risks.push({
        id: `deep-${j.id}`,
        department: "housekeeping",
        text: `Deep clean for Room ${j.roomNumber} has no one assigned.`,
        badge: "Unassigned clean",
      });
    }
  }
  return risks;
}

export function riskBadge(risks: DayRisk[]) {
  if (risks.length === 0) return null;
  if (risks.length === 1) return risks[0].badge;
  return `${risks.length} issues`;
}

// ---------------------------------------------------------------- Resident lens

export type Signal = { id: string; label: string; strong: boolean };

export type Insight = { department: Department; title: string; detail: string };

export type TimelineEntry = {
  id: string;
  at: number;
  department: Department;
  text: string;
  tag: string | null;
};

function weekFeedback(state: AppState, room: string, now: number) {
  return state.roomFeedback.filter((f) => f.roomNumber === room && now - f.at < 7 * DAY);
}

function trayWaits(state: AppState, now: number, room?: string) {
  return state.orders
    .filter(
      (o) =>
        o.type === "to_go" &&
        o.readyAt &&
        o.completedAt &&
        now - o.createdAt < 7 * DAY &&
        (!room || o.roomNumber === room),
    )
    .map((o) => (o.completedAt ?? 0) - (o.readyAt ?? 0));
}

function attended(state: AppState, room: string, from: number, to: number) {
  return state.events.filter(
    (e) => e.kind === "activity" && e.attendance.includes(room) && e.startsAt >= from && e.startsAt < to,
  ).length;
}

function dineInSwitch(state: AppState, room: string, now: number) {
  const lunches = state.orders.filter((o) => o.roomNumber === room && o.meal === "lunch");
  const thisWeek = lunches.filter((o) => now - o.createdAt < 7 * DAY);
  const lastWeek = lunches.filter((o) => now - o.createdAt >= 7 * DAY && now - o.createdAt < 14 * DAY);
  const switched =
    thisWeek.length > 0 &&
    thisWeek.every((o) => o.type === "to_go") &&
    lastWeek.some((o) => o.type === "dine_in");
  if (!switched) return null;
  const firstTray = Math.min(...thisWeek.map((o) => o.createdAt));
  return Math.max(1, Math.round((now - firstTray) / DAY));
}

export function roomSignals(state: AppState, room: string, now: number): Signal[] {
  const out: Signal[] = [];
  const fb = weekFeedback(state, room, now).filter((f) => f.kind === "complaint");
  const meal = fb.filter((f) => f.department === "dining").length;
  const other = fb.length - meal;
  if (meal) out.push({ id: "meal", label: `${meal} meal complaint${meal === 1 ? "" : "s"}`, strong: true });

  const waits = avg(trayWaits(state, now, room));
  if (waits !== null && waits > TRAY_WAIT_LIMIT) out.push({ id: "trays", label: "Trays waiting", strong: true });

  const repair = state.maintenance
    .filter((m) => m.roomNumber === room && m.status !== "done" && now - m.createdAt > DAY)
    .sort((a, b) => a.createdAt - b.createdAt)[0];
  if (repair) {
    const days = Math.floor((now - repair.createdAt) / DAY);
    out.push({ id: "repair", label: `Open repair ${days} day${days === 1 ? "" : "s"}`, strong: true });
  }
  if (other) out.push({ id: "complaints", label: `${other} complaint${other === 1 ? "" : "s"}`, strong: true });

  const thisWeek = attended(state, room, now - 7 * DAY, now + DAY);
  const lastWeek = attended(state, room, now - 14 * DAY, now - 7 * DAY);
  if (lastWeek >= 2 && thisWeek < lastWeek) out.push({ id: "attendance", label: "Attending less", strong: true });

  const long = state.cleanJobs.some(
    (j) =>
      j.roomNumber === room &&
      j.kind === "routine" &&
      j.startedAt &&
      j.finishedAt &&
      now - j.finishedAt < 7 * DAY &&
      j.finishedAt - j.startedAt > state.cleanTargets.routine * MIN,
  );
  if (long) out.push({ id: "clean", label: "Room clean ran long", strong: false });

  const stay = state.stays.find((s) => s.roomNumber === room && !s.checkedOutAt);
  if (stay?.endsOn === dateKey(now)) out.push({ id: "moveout", label: "Move-out today", strong: false });
  else if (stay && now - stay.checkedInAt < 3 * DAY) out.push({ id: "new", label: "New this week", strong: false });

  return out;
}

export function needsVisit(signals: Signal[]) {
  return signals.some((s) => s.strong) || signals.length >= 2;
}

export function roomInsights(state: AppState, room: string, now: number): Insight[] {
  const out: Insight[] = [];
  const fb = weekFeedback(state, room, now).filter((f) => f.kind === "complaint");
  const meal = fb.filter((f) => f.department === "dining");
  if (meal.length) {
    const cold = meal.filter((f) => f.topic === "food_temperature").length;
    out.push({
      department: "dining",
      title:
        cold === meal.length
          ? `${meal.length} complaint${meal.length === 1 ? "" : "s"} about cold food`
          : `${meal.length} meal complaint${meal.length === 1 ? "" : "s"}`,
      detail: `Last one ${formatDayShort(Math.max(...meal.map((f) => f.at)))}.`,
    });
  }
  const mine = avg(trayWaits(state, now, room));
  const everyone = avg(trayWaits(state, now));
  if (mine !== null && mine > TRAY_WAIT_LIMIT) {
    out.push({
      department: "dining",
      title: `Trays wait ${formatSpan(mine)} on average`,
      detail: everyone !== null ? `Building average is ${formatSpan(everyone)}.` : "",
    });
  }
  const switched = dineInSwitch(state, room, now);
  if (switched) {
    out.push({
      department: "activities",
      title: "Stopped coming to lunch in person",
      detail: `Switched to to-go trays ${switched} day${switched === 1 ? "" : "s"} ago.`,
    });
  }
  const thisWeek = attended(state, room, now - 7 * DAY, now + DAY);
  const lastWeek = attended(state, room, now - 14 * DAY, now - 7 * DAY);
  if (lastWeek >= 2 && thisWeek < lastWeek) {
    out.push({
      department: "activities",
      title: `Came to ${thisWeek} ${thisWeek === 1 ? "activity" : "activities"} this week`,
      detail: `${lastWeek} last week.`,
    });
  }
  const repair = state.maintenance.find((m) => m.roomNumber === room && m.status !== "done");
  if (repair) {
    out.push({
      department: "maintenance",
      title: `Open repair: ${repair.title}`,
      detail: `Waiting ${formatSpan(now - repair.createdAt)}${repair.assignedTo ? "" : ", no one assigned"}.`,
    });
  }
  const other = fb.filter((f) => f.department !== "dining");
  if (other.length) {
    out.push({
      department: other[0].department,
      title: `${other.length} other complaint${other.length === 1 ? "" : "s"}`,
      detail: other.map((f) => FEEDBACK_TOPIC_LABEL[f.topic]).join(", "),
    });
  }
  return out;
}

function formatDayShort(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { weekday: "short" });
}

export function roomTimeline(state: AppState, room: string, now: number): TimelineEntry[] {
  const from = now - 7 * DAY;
  const out: TimelineEntry[] = [];
  for (const o of state.orders) {
    if (o.roomNumber !== room || o.createdAt < from || o.type !== "to_go" || !o.readyAt || !o.completedAt) continue;
    const wait = o.completedAt - o.readyAt;
    out.push({
      id: o.id,
      at: o.completedAt,
      department: "dining",
      text: `To-go tray delivered ${formatSpan(wait)} after ready`,
      tag: wait > TRAY_WAIT_LIMIT ? "Late" : null,
    });
  }
  for (const f of state.roomFeedback) {
    if (f.roomNumber !== room || f.at < from) continue;
    out.push(feedbackEntry(f));
  }
  for (const j of state.cleanJobs) {
    if (j.roomNumber !== room || !j.finishedAt || !j.startedAt || j.finishedAt < from) continue;
    const length = j.finishedAt - j.startedAt;
    out.push({
      id: j.id,
      at: j.finishedAt,
      department: "housekeeping",
      text: `${j.kind === "deep" ? "Deep clean" : "Room cleaned"} · ${formatSpan(length)} · checklist complete`,
      tag: length > state.cleanTargets[j.kind] * MIN ? "Long" : null,
    });
  }
  for (const e of state.events) {
    if (!e.attendance.includes(room) || e.startsAt < from) continue;
    out.push({ id: e.id, at: e.startsAt, department: "activities", text: `${e.title} · attended`, tag: null });
  }
  for (const m of state.maintenance) {
    if (m.roomNumber !== room) continue;
    if (m.createdAt >= from) {
      out.push({ id: `${m.id}-in`, at: m.createdAt, department: "maintenance", text: `Repair requested: ${m.title}`, tag: null });
    }
    if (m.fixedAt && m.fixedAt >= from) {
      out.push({ id: `${m.id}-done`, at: m.fixedAt, department: "maintenance", text: `Repair fixed: ${m.title}`, tag: null });
    }
  }
  for (const v of state.visits) {
    if (v.roomNumber !== room || !v.doneAt || v.doneAt < from) continue;
    out.push({ id: v.id, at: v.doneAt, department: "activities", text: `Visited by ${handle(v.createdBy)}: ${v.reason}`, tag: null });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, 14);
}

function feedbackEntry(f: RoomFeedback): TimelineEntry {
  return {
    id: f.id,
    at: f.at,
    department: f.department,
    text: f.kind === "complaint" ? `Complaint logged: “${f.text}”` : `Compliment: “${f.text}”`,
    tag: f.kind === "complaint" ? "Complaint" : "Compliment",
  };
}
