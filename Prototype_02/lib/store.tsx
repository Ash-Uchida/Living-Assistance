"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dateKey, isDateKey } from "./dates";
import {
  DEFAULT_STAFF,
  DEPARTMENT_LEAD,
  isWorkEmail,
  normalizeEmail,
  seedState,
  withTodaysRoutineCleans,
} from "./seed";
import type {
  AppState,
  CleanJob,
  Department,
  EmployeeAccount,
  EventKind,
  FeedbackKind,
  FeedbackTopic,
  MaintenancePriority,
  MaintenanceStatus,
  Meal,
  MenuFile,
  Notice,
  OrderType,
  Role,
  Thumbs,
} from "./types";

const STORAGE_KEY = "homestead-prototype-02-v1";

let idCounter = 0;
function newId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function notice(input: Omit<Notice, "id" | "at" | "readBy">): Notice {
  return { ...input, id: newId("nt"), at: Date.now(), readBy: [] };
}

type Store = AppState & {
  ready: boolean;
  saveError: string | null;
  me: EmployeeAccount | undefined;
  myNotices: Notice[];
  unreadCount: number;
  signIn: (email: string) => string | null;
  signOut: () => void;
  addEmployee: (email: string, role?: Role | null) => string | null;
  changeEmployeeRole: (id: string, role: Role | null) => string | null;
  removeEmployee: (id: string) => string | null;
  currentStay: (roomNumber: string) => AppState["stays"][number] | undefined;
  checkIn: (roomNumber: string, startsOn: string, endsOn: string) => string | null;
  checkOut: (roomNumber: string) => string | null;
  setRoomAssignee: (roomNumber: string, employeeId: string | null) => void;
  toggleCleanDay: (roomNumber: string, weekday: number) => void;
  assignJob: (jobId: string, employeeId: string | null) => string | null;
  startJob: (jobId: string) => string | null;
  toggleJobItem: (jobId: string, itemId: string) => void;
  finishJob: (jobId: string) => string | null;
  addJobNote: (jobId: string, text: string) => string | null;
  addMaintenance: (input: {
    title: string;
    roomNumber: string | null;
    area: string;
    details: string;
    photos: string[];
    priority: MaintenancePriority;
    cleanJobId?: string | null;
  }) => string | null;
  updateMaintenance: (
    id: string,
    status: MaintenanceStatus,
    note: string,
  ) => string | null;
  assignMaintenance: (id: string, employeeId: string | null) => string | null;
  markMaintenanceSeen: (id: string) => void;
  addOrder: (input: {
    roomNumber: string;
    meal: Meal;
    itemId: string | null;
    special: string;
    type: OrderType;
  }) => string | null;
  startOrder: (orderId: string) => string | null;
  readyOrder: (orderId: string) => string | null;
  completeOrder: (orderId: string) => string | null;
  resendOrderAlert: (orderId: string) => string | null;
  addMenuItem: (meal: Meal, name: string) => string | null;
  removeMenuItem: (id: string) => void;
  setMenuFile: (file: MenuFile) => void;
  removeMenuFile: (meal: Meal) => void;
  logTemp: (fridgeId: string, tempF: number) => string | null;
  toggleChecklist: (itemId: string) => void;
  addFeedback: (meal: Meal, itemId: string, thumbs: Thumbs) => string | null;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  addEvent: (input: {
    title: string;
    kind: EventKind;
    startsAt: number;
    allDay?: boolean;
    building: string | null;
    place?: string;
    roomNumber: string | null;
  }) => string | null;
  removeEvent: (id: string) => string | null;
  toggleAttendance: (eventId: string, roomNumber: string) => void;
  sendNotice: (input: { title: string; body: string; toRoles: Role[] }) => string | null;
  addRoomFeedback: (input: {
    roomNumber: string;
    department: Department;
    kind: FeedbackKind;
    topic: FeedbackTopic;
    text: string;
  }) => string | null;
  planVisit: (roomNumber: string, on: string, reason: string) => string | null;
  finishVisit: (id: string) => void;
  setScheduled: (on: string, department: Department, scheduled: number) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

function isCurrentShape(parsed: Partial<AppState>) {
  return (
    Array.isArray(parsed.employees) &&
    Array.isArray(parsed.events) &&
    Array.isArray(parsed.cleanJobs) &&
    Array.isArray(parsed.maintenance) &&
    Array.isArray(parsed.notices) &&
    Array.isArray(parsed.roomFeedback) &&
    Array.isArray(parsed.visits) &&
    Array.isArray(parsed.staffing) &&
    typeof parsed.signedInEmail === "string"
  );
}

function updateJob(
  prev: AppState,
  jobId: string,
  change: (job: CleanJob) => CleanJob,
): AppState {
  return {
    ...prev,
    cleanJobs: prev.cleanJobs.map((job) => (job.id === jobId ? change(job) : job)),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // localStorage only exists after mount; reading it during render would mismatch the server HTML.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (isCurrentShape(parsed)) setState(withTodaysRoutineCleans(parsed));
      }
    } catch {
      /* keep seed */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveError(null);
    } catch {
      setSaveError("Browser storage is full. Remove a photo or menu file.");
    }
  }, [ready, state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const me = state.employees.find((e) => e.email === state.signedInEmail);

  const myNotices = useMemo(
    () =>
      state.notices
        .filter(
          (n) =>
            n.toRoles.includes(state.role) ||
            n.toEmails.includes(state.signedInEmail),
        )
        .sort((a, b) => b.at - a.at),
    [state.notices, state.role, state.signedInEmail],
  );
  const unreadCount = myNotices.filter(
    (n) => !n.readBy.includes(state.signedInEmail),
  ).length;

  const signIn = useCallback((email: string) => {
    const normalized = normalizeEmail(email);
    if (!isWorkEmail(normalized)) return "Enter a work email.";
    let error: string | null = null;
    setState((prev) => {
      const account = prev.employees.find((e) => e.email === normalized);
      if (!account) {
        error = "That email is not on the access list.";
        return prev;
      }
      if (!account.role) {
        error = "That email has no job yet. Ask Baker to drop them into a box.";
        return prev;
      }
      return {
        ...prev,
        signedInEmail: account.email,
        role: account.role,
        staffId: DEFAULT_STAFF[account.role],
      };
    });
    return error;
  }, []);

  const signOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signedInEmail: "",
      role: "housekeeper",
      staffId: DEFAULT_STAFF.housekeeper,
    }));
  }, []);

  const addEmployee = useCallback((email: string, role: Role | null = null) => {
    const normalized = normalizeEmail(email);
    if (!isWorkEmail(normalized)) return "Enter a work email.";
    let error: string | null = null;
    setState((prev) => {
      if (prev.employees.some((e) => e.email === normalized)) {
        error = "That email is already on the list.";
        return prev;
      }
      return {
        ...prev,
        employees: [...prev.employees, { id: newId("e"), email: normalized, role }],
      };
    });
    return error;
  }, []);

  const changeEmployeeRole = useCallback((id: string, role: Role | null) => {
    let error: string | null = null;
    setState((prev) => {
      const target = prev.employees.find((e) => e.id === id);
      if (!target) {
        error = "Unknown email.";
        return prev;
      }
      const managers = prev.employees.filter((e) => e.role === "ops_manager");
      if (target.role === "ops_manager" && role !== "ops_manager" && managers.length < 2) {
        error = "Keep Baker (or another operations manager) in Operations.";
        return prev;
      }
      const signedInHere = prev.signedInEmail === target.email;
      const lostJob = signedInHere && role === null;
      return {
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, role } : e)),
        signedInEmail: lostJob ? "" : prev.signedInEmail,
        role: signedInHere && role ? role : prev.role,
        staffId: signedInHere && role ? DEFAULT_STAFF[role] : prev.staffId,
      };
    });
    return error;
  }, []);

  const removeEmployee = useCallback((id: string) => {
    let error: string | null = null;
    setState((prev) => {
      const target = prev.employees.find((e) => e.id === id);
      if (!target) {
        error = "Unknown email.";
        return prev;
      }
      const managers = prev.employees.filter((e) => e.role === "ops_manager");
      if (target.role === "ops_manager" && managers.length < 2) {
        error = "Keep at least one operations manager.";
        return prev;
      }
      return {
        ...prev,
        employees: prev.employees.filter((e) => e.id !== id),
        signedInEmail: prev.signedInEmail === target.email ? "" : prev.signedInEmail,
      };
    });
    return error;
  }, []);

  const currentStay = useCallback(
    (roomNumber: string) =>
      state.stays.find((s) => s.roomNumber === roomNumber && !s.checkedOutAt),
    [state.stays],
  );

  const checkIn = useCallback((roomNumber: string, startsOn: string, endsOn: string) => {
    if (!roomNumber) return "Pick a room.";
    if (!isDateKey(startsOn) || !isDateKey(endsOn)) {
      return "Pick a start date and an end date.";
    }
    if (endsOn < startsOn) return "The end date has to be on or after the start.";
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const room = prev.rooms.find((r) => r.number === roomNumber);
      if (!room) {
        error = "Unknown room.";
        return prev;
      }
      if (room.occupancy === "occupied") {
        error = "That room is already occupied.";
        return prev;
      }
      if (room.occupancy === "needs_cleaning") {
        error = "That room still needs its deep clean.";
        return prev;
      }
      return withTodaysRoutineCleans(
        {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.number === roomNumber ? { ...r, occupancy: "occupied" } : r,
          ),
          stays: [
            {
              id: newId("s"),
              roomNumber,
              startsOn,
              endsOn,
              checkedInAt: now,
              checkedOutAt: null,
            },
            ...prev.stays,
          ],
        },
        now,
      );
    });
    return error;
  }, []);

  const checkOut = useCallback((roomNumber: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const room = prev.rooms.find((r) => r.number === roomNumber);
      if (!room) {
        error = "Unknown room.";
        return prev;
      }
      if (room.occupancy !== "occupied") {
        error = "No one is checked in here.";
        return prev;
      }
      const today = dateKey(now);
      const deep: CleanJob = {
        id: newId("j"),
        roomNumber,
        kind: "deep",
        dueOn: today,
        createdAt: now,
        assignedTo: null,
        status: "not_started",
        startedAt: null,
        finishedAt: null,
        checked: [],
        notes: [],
      };
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.number === roomNumber ? { ...r, occupancy: "needs_cleaning" } : r,
        ),
        stays: prev.stays.map((s) =>
          s.roomNumber === roomNumber && !s.checkedOutAt ? { ...s, checkedOutAt: now } : s,
        ),
        cleanJobs: [
          deep,
          ...prev.cleanJobs.filter(
            (job) =>
              !(
                job.roomNumber === roomNumber &&
                job.kind === "routine" &&
                job.status === "not_started"
              ),
          ),
        ],
        notices: [
          notice({
            title: `Room ${roomNumber} needs a deep clean`,
            body: "Checked out. Pick a housekeeper for the deep clean.",
            href: "/housekeeping/assign",
            toRoles: ["hk_director", "ops_manager"],
            toEmails: [],
          }),
          ...prev.notices,
        ],
      };
    });
    return error;
  }, []);

  const setRoomAssignee = useCallback((roomNumber: string, employeeId: string | null) => {
    const today = dateKey(Date.now());
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.number === roomNumber ? { ...r, assignedTo: employeeId } : r,
      ),
      cleanJobs: prev.cleanJobs.map((job) =>
        job.roomNumber === roomNumber &&
        job.kind === "routine" &&
        job.dueOn >= today &&
        job.status === "not_started"
          ? { ...job, assignedTo: employeeId }
          : job,
      ),
    }));
  }, []);

  const toggleCleanDay = useCallback((roomNumber: string, weekday: number) => {
    setState((prev) =>
      withTodaysRoutineCleans({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.number === roomNumber
            ? {
                ...r,
                cleanDays: r.cleanDays.includes(weekday)
                  ? r.cleanDays.filter((d) => d !== weekday)
                  : [...r.cleanDays, weekday].sort(),
              }
            : r,
        ),
      }),
    );
  }, []);

  const assignJob = useCallback((jobId: string, employeeId: string | null) => {
    let error: string | null = null;
    setState((prev) => {
      const job = prev.cleanJobs.find((j) => j.id === jobId);
      if (!job) {
        error = "Unknown clean.";
        return prev;
      }
      if (job.status === "done") {
        error = "That clean is already done.";
        return prev;
      }
      const email = prev.employees.find((e) => e.id === employeeId)?.email;
      const next = updateJob(prev, jobId, (j) => ({ ...j, assignedTo: employeeId }));
      if (!email) return next;
      return {
        ...next,
        notices: [
          notice({
            title: `${job.kind === "deep" ? "Deep clean" : "Clean"} assigned: room ${job.roomNumber}`,
            body: "It is on your Housekeeping list now.",
            href: "/housekeeping",
            toRoles: [],
            toEmails: [email],
          }),
          ...next.notices,
        ],
      };
    });
    return error;
  }, []);

  const startJob = useCallback((jobId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const job = prev.cleanJobs.find((j) => j.id === jobId);
      if (!job) {
        error = "Unknown clean.";
        return prev;
      }
      if (job.status !== "not_started") {
        error = job.status === "done" ? "Already done." : "Already started.";
        return prev;
      }
      if (!job.assignedTo) {
        error = "Assign this clean to someone first.";
        return prev;
      }
      return updateJob(prev, jobId, (j) => ({ ...j, status: "in_progress", startedAt: now }));
    });
    return error;
  }, []);

  const toggleJobItem = useCallback((jobId: string, itemId: string) => {
    setState((prev) =>
      updateJob(prev, jobId, (job) =>
        job.status !== "in_progress"
          ? job
          : {
              ...job,
              checked: job.checked.includes(itemId)
                ? job.checked.filter((id) => id !== itemId)
                : [...job.checked, itemId],
            },
      ),
    );
  }, []);

  const finishJob = useCallback((jobId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const job = prev.cleanJobs.find((j) => j.id === jobId);
      if (!job) {
        error = "Unknown clean.";
        return prev;
      }
      if (job.status !== "in_progress") {
        error = job.status === "done" ? "Already done." : "Start the clean first.";
        return prev;
      }
      const left = prev.cleanChecklists[job.kind].filter(
        (item) => !job.checked.includes(item.id),
      ).length;
      if (left > 0) {
        error = `${left} checklist ${left === 1 ? "item" : "items"} left.`;
        return prev;
      }
      const next = updateJob(prev, jobId, (j) => ({ ...j, status: "done", finishedAt: now }));
      if (job.kind !== "deep") return next;
      return {
        ...next,
        rooms: next.rooms.map((r) =>
          r.number === job.roomNumber && r.occupancy === "needs_cleaning"
            ? { ...r, occupancy: "vacant" }
            : r,
        ),
      };
    });
    return error;
  }, []);

  const addJobNote = useCallback((jobId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return "Write the note first.";
    let error: string | null = null;
    setState((prev) => {
      const job = prev.cleanJobs.find((j) => j.id === jobId);
      if (!job) {
        error = "Unknown clean.";
        return prev;
      }
      const next = updateJob(prev, jobId, (j) => ({
        ...j,
        notes: [
          ...j.notes,
          { id: newId("n"), text: clean, at: Date.now(), by: prev.signedInEmail },
        ],
      }));
      return {
        ...next,
        notices: [
          notice({
            title: `Housekeeping note: room ${job.roomNumber}`,
            body: clean,
            href: `/housekeeping/clean/${job.id}`,
            toRoles: ["hk_director"],
            toEmails: [],
          }),
          ...next.notices,
        ],
      };
    });
    return error;
  }, []);

  const addMaintenance = useCallback<Store["addMaintenance"]>((input) => {
    const title = input.title.trim();
    if (!title) return "Say what is wrong.";
    if (!input.roomNumber && !input.area.trim()) return "Pick a room or name the area.";
    const now = Date.now();
    setState((prev) => {
      const id = newId("m");
      const where = input.roomNumber ? `Room ${input.roomNumber}` : input.area.trim();
      let next: AppState = {
        ...prev,
        maintenance: [
          {
            id,
            title,
            roomNumber: input.roomNumber,
            area: input.roomNumber ? "" : input.area.trim(),
            details: input.details.trim(),
            photos: input.photos,
            priority: input.priority,
            status: "open",
            createdAt: now,
            createdBy: prev.signedInEmail,
            assignedTo: null,
            seenAt: null,
            assignedAt: null,
            fixedAt: null,
            cleanJobId: input.cleanJobId ?? null,
            updates: [],
          },
          ...prev.maintenance,
        ],
        notices: [
          notice({
            title: `${input.priority === "urgent" ? "Urgent" : "New"} request: ${title}`,
            body: `${where} · from ${prev.signedInEmail}`,
            href: "/maintenance",
            toRoles: ["maintenance", "ops_manager"],
            toEmails: [],
          }),
          ...prev.notices,
        ],
      };
      if (input.cleanJobId) {
        next = updateJob(next, input.cleanJobId, (j) => ({
          ...j,
          notes: [
            ...j.notes,
            {
              id: newId("n"),
              text: `Maintenance request sent: ${title}`,
              at: now,
              by: prev.signedInEmail,
            },
          ],
        }));
      }
      return next;
    });
    return null;
  }, []);

  const updateMaintenance = useCallback(
    (id: string, status: MaintenanceStatus, note: string) => {
      let error: string | null = null;
      setState((prev) => {
        const request = prev.maintenance.find((m) => m.id === id);
        if (!request) {
          error = "Unknown request.";
          return prev;
        }
        if (request.status === status && !note.trim()) {
          error = "Pick a new status or add a note.";
          return prev;
        }
        const now = Date.now();
        return {
          ...prev,
          maintenance: prev.maintenance.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status,
                  seenAt: m.seenAt ?? now,
                  fixedAt: status === "done" ? now : null,
                  updates: [
                    ...m.updates,
                    { id: newId("mu"), status, note: note.trim(), at: now, by: prev.signedInEmail },
                  ],
                }
              : m,
          ),
          notices: [
            notice({
              title: `Request update: ${request.title}`,
              body: note.trim() || `Now ${status.replace("_", " ")}.`,
              href: "/maintenance",
              toRoles: [],
              toEmails: [request.createdBy],
            }),
            ...prev.notices,
          ],
        };
      });
      return error;
    },
    [],
  );

  const assignMaintenance = useCallback((id: string, employeeId: string | null) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const request = prev.maintenance.find((m) => m.id === id);
      if (!request) {
        error = "Unknown request.";
        return prev;
      }
      if (request.status === "done") {
        error = "That request is already done.";
        return prev;
      }
      const email = prev.employees.find((e) => e.id === employeeId)?.email;
      const next: AppState = {
        ...prev,
        maintenance: prev.maintenance.map((m) =>
          m.id === id
            ? {
                ...m,
                assignedTo: employeeId,
                seenAt: m.seenAt ?? now,
                assignedAt: employeeId ? (m.assignedAt ?? now) : null,
              }
            : m,
        ),
      };
      if (!email) return next;
      return {
        ...next,
        notices: [
          notice({
            title: `Repair assigned: ${request.title}`,
            body: request.roomNumber ? `Room ${request.roomNumber}` : request.area,
            href: "/maintenance",
            toRoles: [],
            toEmails: [email],
          }),
          ...next.notices,
        ],
      };
    });
    return error;
  }, []);

  const markMaintenanceSeen = useCallback((id: string) => {
    const now = Date.now();
    setState((prev) =>
      prev.maintenance.some((m) => m.id === id && !m.seenAt)
        ? {
            ...prev,
            maintenance: prev.maintenance.map((m) =>
              m.id === id && !m.seenAt ? { ...m, seenAt: now } : m,
            ),
          }
        : prev,
    );
  }, []);

  const addOrder = useCallback<Store["addOrder"]>((input) => {
    if (!input.roomNumber) return "Pick a room.";
    const special = input.special.trim();
    if (!input.itemId && !special) return "Describe the special order.";
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      orders: [
        {
          id: newId("o"),
          roomNumber: input.roomNumber,
          meal: input.meal,
          itemId: input.itemId,
          special,
          type: input.type,
          status: "pending",
          createdAt: now,
          startedAt: null,
          readyAt: null,
          completedAt: null,
          placedBy: prev.signedInEmail,
          stationId: prev.staffId,
        },
        ...prev.orders,
      ],
    }));
    return null;
  }, []);

  const startOrder = useCallback((orderId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) {
        error = "Unknown order.";
        return prev;
      }
      if (order.status !== "pending") {
        error = "That order is already moving.";
        return prev;
      }
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: "preparing", startedAt: now } : o,
        ),
      };
    });
    return error;
  }, []);

  const readyOrder = useCallback((orderId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) {
        error = "Unknown order.";
        return prev;
      }
      if (order.status === "ready" || order.status === "complete") {
        error = "Already marked ready.";
        return prev;
      }
      const how = order.type === "to_go" ? "To-go tray" : "Dine-in";
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: "ready", startedAt: o.startedAt ?? now, readyAt: now }
            : o,
        ),
        notices: [
          notice({
            title: `Order ready: room ${order.roomNumber}`,
            body: `${how} is ready for pickup.`,
            href: "/dining/order",
            toRoles: ["nurse_station"],
            toEmails: order.placedBy ? [order.placedBy] : [],
          }),
          ...prev.notices,
        ],
      };
    });
    return error;
  }, []);

  const completeOrder = useCallback((orderId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) {
        error = "Unknown order.";
        return prev;
      }
      if (order.status === "complete") {
        error = "Already complete.";
        return prev;
      }
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "complete",
                startedAt: o.startedAt ?? now,
                readyAt: o.readyAt ?? now,
                completedAt: now,
              }
            : o,
        ),
      };
    });
    return error;
  }, []);

  const resendOrderAlert = useCallback((orderId: string) => {
    let error: string | null = null;
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order || order.status !== "ready") {
        error = "That order is not waiting for pickup.";
        return prev;
      }
      const how = order.type === "to_go" ? "To-go tray" : "Dine-in";
      return {
        ...prev,
        notices: [
          notice({
            title: `Still waiting: room ${order.roomNumber}`,
            body: `${how} has been ready since ${new Date(order.readyAt ?? Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Please pick it up.`,
            href: "/dining/order",
            toRoles: ["nurse_station"],
            toEmails: order.placedBy ? [order.placedBy] : [],
          }),
          ...prev.notices,
        ],
      };
    });
    return error;
  }, []);

  const addMenuItem = useCallback((meal: Meal, name: string) => {
    const clean = name.trim();
    if (!clean) return "Type the dish name.";
    setState((prev) => ({
      ...prev,
      menu: [...prev.menu, { id: newId("mi"), meal, name: clean }],
    }));
    return null;
  }, []);

  const removeMenuItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, menu: prev.menu.filter((m) => m.id !== id) }));
  }, []);

  const setMenuFile = useCallback((file: MenuFile) => {
    setState((prev) => ({
      ...prev,
      menuFiles: [...prev.menuFiles.filter((f) => f.meal !== file.meal), file],
    }));
  }, []);

  const removeMenuFile = useCallback((meal: Meal) => {
    setState((prev) => ({
      ...prev,
      menuFiles: prev.menuFiles.filter((f) => f.meal !== meal),
    }));
  }, []);

  const logTemp = useCallback((fridgeId: string, tempF: number) => {
    if (!fridgeId) return "Pick a fridge.";
    if (!Number.isFinite(tempF) || tempF < 20 || tempF > 60) {
      return "Enter a temperature between 20 and 60 °F.";
    }
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      temps: [
        { id: newId("temp"), fridgeId, tempF, recordedAt: now, stationId: prev.staffId },
        ...prev.temps,
      ],
    }));
    return null;
  }, []);

  const toggleChecklist = useCallback((itemId: string) => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      checklistDone: prev.checklistDone.map((c) =>
        c.itemId === itemId
          ? c.completedAt
            ? { itemId, completedAt: null, stationId: null }
            : { itemId, completedAt: now, stationId: prev.staffId }
          : c,
      ),
    }));
  }, []);

  const addFeedback = useCallback((meal: Meal, itemId: string, thumbs: Thumbs) => {
    if (!itemId) return "Pick a menu item.";
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      feedback: [{ id: newId("f"), meal, itemId, thumbs, createdAt: now }, ...prev.feedback],
    }));
    return null;
  }, []);

  const markNoticeRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notices: prev.notices.map((n) =>
        n.id === id && !n.readBy.includes(prev.signedInEmail)
          ? { ...n, readBy: [...n.readBy, prev.signedInEmail] }
          : n,
      ),
    }));
  }, []);

  const markAllNoticesRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notices: prev.notices.map((n) =>
        (n.toRoles.includes(prev.role) || n.toEmails.includes(prev.signedInEmail)) &&
        !n.readBy.includes(prev.signedInEmail)
          ? { ...n, readBy: [...n.readBy, prev.signedInEmail] }
          : n,
      ),
    }));
  }, []);

  const addEvent = useCallback<Store["addEvent"]>((input) => {
    const title = input.title.trim();
    if (!title) return "Say what is happening.";
    if (!Number.isFinite(input.startsAt)) return "Pick a day.";
    if (input.kind === "activity" && !input.building) return "Pick the building.";
    setState((prev) => ({
      ...prev,
      events: [
        {
          id: newId("ev"),
          title,
          kind: input.kind,
          startsAt: input.startsAt,
          allDay: input.allDay ?? false,
          building: input.building,
          place: input.place?.trim() ?? "",
          roomNumber: input.roomNumber?.trim() || null,
          attendance: [],
          attendanceAt: null,
        },
        ...prev.events,
      ],
    }));
    return null;
  }, []);

  const removeEvent = useCallback((id: string) => {
    let error: string | null = null;
    setState((prev) => {
      if (!prev.events.some((event) => event.id === id)) {
        error = "Unknown event.";
        return prev;
      }
      return { ...prev, events: prev.events.filter((event) => event.id !== id) };
    });
    return error;
  }, []);

  const toggleAttendance = useCallback((eventId: string, roomNumber: string) => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      events: prev.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              attendance: event.attendance.includes(roomNumber)
                ? event.attendance.filter((r) => r !== roomNumber)
                : [...event.attendance, roomNumber].sort(),
              attendanceAt: event.attendanceAt ?? now,
            }
          : event,
      ),
    }));
  }, []);

  const sendNotice = useCallback<Store["sendNotice"]>((input) => {
    const title = input.title.trim();
    if (!title) return "Give the notice a title.";
    if (input.toRoles.length === 0) return "Pick at least one job to send it to.";
    setState((prev) => ({
      ...prev,
      notices: [
        notice({
          title,
          body: `${input.body.trim()}${input.body.trim() ? " · " : ""}from ${prev.signedInEmail}`,
          href: "/inbox",
          toRoles: input.toRoles,
          toEmails: [],
        }),
        ...prev.notices,
      ],
    }));
    return null;
  }, []);

  const addRoomFeedback = useCallback<Store["addRoomFeedback"]>((input) => {
    if (!input.roomNumber) return "Pick a room.";
    const text = input.text.trim();
    if (!text) return "Write what they said.";
    const now = Date.now();
    setState((prev) => {
      const next: AppState = {
        ...prev,
        roomFeedback: [
          {
            id: newId("rf"),
            roomNumber: input.roomNumber,
            department: input.department,
            kind: input.kind,
            topic: input.topic,
            text,
            at: now,
            by: prev.signedInEmail,
          },
          ...prev.roomFeedback,
        ],
      };
      if (input.kind !== "complaint") return next;
      return {
        ...next,
        notices: [
          notice({
            title: `Complaint from room ${input.roomNumber}`,
            body: text,
            href: `/residents/${input.roomNumber}`,
            toRoles: [DEPARTMENT_LEAD[input.department]],
            toEmails: [],
          }),
          ...next.notices,
        ],
      };
    });
    return null;
  }, []);

  const planVisit = useCallback((roomNumber: string, on: string, reason: string) => {
    if (!roomNumber) return "Pick a room.";
    if (!isDateKey(on)) return "Pick a day.";
    const clean = reason.trim();
    if (!clean) return "Say why you are visiting.";
    setState((prev) => ({
      ...prev,
      visits: [
        { id: newId("v"), roomNumber, on, reason: clean, createdBy: prev.signedInEmail, doneAt: null },
        ...prev.visits,
      ],
    }));
    return null;
  }, []);

  const finishVisit = useCallback((id: string) => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === id ? { ...v, doneAt: v.doneAt ? null : now } : v)),
    }));
  }, []);

  const setScheduled = useCallback((on: string, department: Department, scheduled: number) => {
    const count = Math.max(0, Math.round(scheduled));
    setState((prev) => {
      const exists = prev.staffing.some((s) => s.on === on && s.department === department);
      return {
        ...prev,
        staffing: exists
          ? prev.staffing.map((s) =>
              s.on === on && s.department === department ? { ...s, scheduled: count } : s,
            )
          : [...prev.staffing, { on, department, needed: count, scheduled: count }],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(seedState());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      saveError,
      me,
      myNotices,
      unreadCount,
      signIn,
      signOut,
      addEmployee,
      changeEmployeeRole,
      removeEmployee,
      currentStay,
      checkIn,
      checkOut,
      setRoomAssignee,
      toggleCleanDay,
      assignJob,
      startJob,
      toggleJobItem,
      finishJob,
      addJobNote,
      addMaintenance,
      updateMaintenance,
      assignMaintenance,
      markMaintenanceSeen,
      addOrder,
      startOrder,
      readyOrder,
      completeOrder,
      resendOrderAlert,
      addMenuItem,
      removeMenuItem,
      setMenuFile,
      removeMenuFile,
      logTemp,
      toggleChecklist,
      addFeedback,
      markNoticeRead,
      markAllNoticesRead,
      addEvent,
      removeEvent,
      toggleAttendance,
      sendNotice,
      addRoomFeedback,
      planVisit,
      finishVisit,
      setScheduled,
      reset,
    }),
    [
      state,
      ready,
      saveError,
      me,
      myNotices,
      unreadCount,
      signIn,
      signOut,
      addEmployee,
      changeEmployeeRole,
      removeEmployee,
      currentStay,
      checkIn,
      checkOut,
      setRoomAssignee,
      toggleCleanDay,
      assignJob,
      startJob,
      toggleJobItem,
      finishJob,
      addJobNote,
      addMaintenance,
      updateMaintenance,
      assignMaintenance,
      markMaintenanceSeen,
      addOrder,
      startOrder,
      readyOrder,
      completeOrder,
      resendOrderAlert,
      addMenuItem,
      removeMenuItem,
      setMenuFile,
      removeMenuFile,
      logTemp,
      toggleChecklist,
      addFeedback,
      markNoticeRead,
      markAllNoticesRead,
      addEvent,
      removeEvent,
      toggleAttendance,
      sendNotice,
      addRoomFeedback,
      planVisit,
      finishVisit,
      setScheduled,
      reset,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
