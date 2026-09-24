"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isDateKey } from "./dates";
import {
  DEFAULT_STAFF,
  isWorkEmail,
  normalizeEmail,
  seedState,
  toggleRoleModule,
} from "./seed";
import type {
  AppState,
  EventKind,
  Meal,
  ModuleId,
  OrderType,
  Role,
  Thumbs,
} from "./types";

const STORAGE_KEY = "homestead-ops-demo-v10";

type Store = AppState & {
  ready: boolean;
  setRole: (role: Role) => void;
  setStaffId: (staffId: string) => void;
  toggleAccess: (role: Role, moduleId: ModuleId) => void;
  signIn: (email: string) => string | null;
  signOut: () => void;
  addEmployee: (email: string, role?: Role | null) => string | null;
  changeEmployeeRole: (id: string, role: Role | null) => string | null;
  removeEmployee: (id: string) => string | null;
  currentStay: (roomNumber: string) => AppState["stays"][number] | undefined;
  checkIn: (
    roomNumber: string,
    startsOn: string,
    endsOn: string,
  ) => string | null;
  checkOut: (roomNumber: string) => string | null;
  startClean: (roomNumber: string) => string | null;
  finishClean: (roomNumber: string) => string | null;
  addOrder: (input: {
    roomNumber: string;
    meal: Meal;
    itemId: string;
    type: OrderType;
  }) => string | null;
  startOrder: (orderId: string) => string | null;
  serveOrder: (orderId: string) => string | null;
  logTemp: (fridgeId: string, tempF: number) => string | null;
  toggleChecklist: (itemId: string) => void;
  addFeedback: (meal: Meal, itemId: string, thumbs: Thumbs) => string | null;
  setCensus: (census: number) => void;
  setInvoice: (total: number) => void;
  setSupply: (id: string, count: number) => void;
  addEvent: (input: {
    title: string;
    kind: EventKind;
    startsAt: number;
    roomNumber: string | null;
  }) => string | null;
  removeEvent: (id: string) => string | null;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (
          Array.isArray(parsed.employees) &&
          Array.isArray(parsed.events) &&
          typeof parsed.signedInEmail === "string"
        ) {
          setState(parsed);
        }
      }
    } catch {
      /* keep seed */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const setRole = useCallback((role: Role) => {
    setState((prev) => ({
      ...prev,
      role,
      staffId: DEFAULT_STAFF[role],
    }));
  }, []);

  const setStaffId = useCallback((staffId: string) => {
    setState((prev) => ({ ...prev, staffId }));
  }, []);

  const toggleAccess = useCallback((role: Role, moduleId: ModuleId) => {
    setState((prev) => ({
      ...prev,
      access: toggleRoleModule(prev.access, role, moduleId),
    }));
  }, []);

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
        employees: [
          ...prev.employees,
          { id: `e-${Date.now()}`, email: normalized, role },
        ],
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
      if (
        target.role === "ops_manager" &&
        role !== "ops_manager" &&
        managers.length < 2
      ) {
        error = "Keep Baker (or another operations manager) in Operations.";
        return prev;
      }
      const signedInHere = prev.signedInEmail === target.email;
      const lostJob = signedInHere && role === null;
      return {
        ...prev,
        employees: prev.employees.map((e) =>
          e.id === id ? { ...e, role } : e,
        ),
        signedInEmail: lostJob ? "" : prev.signedInEmail,
        role: signedInHere && role ? role : prev.role,
        staffId:
          signedInHere && role ? DEFAULT_STAFF[role] : prev.staffId,
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
        signedInEmail:
          prev.signedInEmail === target.email ? "" : prev.signedInEmail,
      };
    });
    return error;
  }, []);

  const currentStay = useCallback(
    (roomNumber: string) =>
      state.stays.find((s) => s.roomNumber === roomNumber && !s.checkedOutAt),
    [state.stays],
  );

  const checkIn = useCallback(
    (roomNumber: string, startsOn: string, endsOn: string) => {
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
          error = "That room still needs cleaning.";
          return prev;
        }
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.number === roomNumber ? { ...r, occupancy: "occupied" } : r,
          ),
          stays: [
            {
              id: `s-${now}`,
              roomNumber,
              startsOn,
              endsOn,
              checkedInAt: now,
              checkedOutAt: null,
            },
            ...prev.stays,
          ],
        };
      });
      return error;
    },
    [],
  );

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
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.number === roomNumber ? { ...r, occupancy: "needs_cleaning" } : r,
        ),
        stays: prev.stays.map((s) =>
          s.roomNumber === roomNumber && !s.checkedOutAt
            ? { ...s, checkedOutAt: now }
            : s,
        ),
        tasks: prev.tasks.map((t) =>
          t.roomNumber === roomNumber
            ? {
                ...t,
                status: "not_started",
                startedAt: null,
                finishedAt: null,
              }
            : t,
        ),
      };
    });
    return error;
  }, []);

  const startClean = useCallback((roomNumber: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const task = prev.tasks.find((t) => t.roomNumber === roomNumber);
      if (!task) {
        error = "Unknown room.";
        return prev;
      }
      if (task.status === "done") {
        error = "This room is already done. A second tap does not undo it.";
        return prev;
      }
      if (task.status === "in_progress") {
        error = "Already started.";
        return prev;
      }
      const room = prev.rooms.find((r) => r.number === roomNumber);
      if (room?.occupancy !== "needs_cleaning") {
        error = "This room does not need cleaning.";
        return prev;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.roomNumber === roomNumber
            ? { ...t, status: "in_progress", startedAt: now }
            : t,
        ),
      };
    });
    return error;
  }, []);

  const finishClean = useCallback((roomNumber: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const task = prev.tasks.find((t) => t.roomNumber === roomNumber);
      if (!task) {
        error = "Unknown room.";
        return prev;
      }
      if (task.status === "not_started") {
        error = "Start the room before finishing it.";
        return prev;
      }
      if (task.status === "done") {
        error = "Already done.";
        return prev;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.roomNumber === roomNumber
            ? { ...t, status: "done", finishedAt: now }
            : t,
        ),
        rooms: prev.rooms.map((r) =>
          r.number === roomNumber && r.occupancy === "needs_cleaning"
            ? { ...r, occupancy: "vacant" }
            : r,
        ),
      };
    });
    return error;
  }, []);

  const addOrder = useCallback(
    (input: {
      roomNumber: string;
      meal: Meal;
      itemId: string;
      type: OrderType;
    }) => {
      if (!input.roomNumber) return "Pick a room.";
      if (!input.itemId) return "Pick a menu item.";
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        orders: [
          {
            id: `o-${now}`,
            roomNumber: input.roomNumber,
            meal: input.meal,
            itemId: input.itemId,
            type: input.type,
            status: "pending",
            createdAt: now,
            startedAt: null,
            servedAt: null,
            stationId: prev.staffId,
          },
          ...prev.orders,
        ],
      }));
      return null;
    },
    [],
  );

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
          o.id === orderId
            ? { ...o, status: "preparing", startedAt: now }
            : o,
        ),
      };
    });
    return error;
  }, []);

  const serveOrder = useCallback((orderId: string) => {
    let error: string | null = null;
    const now = Date.now();
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) {
        error = "Unknown order.";
        return prev;
      }
      if (order.status === "served") {
        error = "Already served.";
        return prev;
      }
      if (order.status === "pending") {
        error = "Mark it preparing first.";
        return prev;
      }
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: "served", servedAt: now } : o,
        ),
      };
    });
    return error;
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
        {
          id: `temp-${now}`,
          fridgeId,
          tempF,
          recordedAt: now,
          stationId: prev.staffId,
        },
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

  const addFeedback = useCallback(
    (meal: Meal, itemId: string, thumbs: Thumbs) => {
      if (!itemId) return "Pick a menu item.";
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        feedback: [
          {
            id: `f-${now}`,
            meal,
            itemId,
            thumbs,
            createdAt: now,
          },
          ...prev.feedback,
        ],
      }));
      return null;
    },
    [],
  );

  const setCensus = useCallback((census: number) => {
    if (!Number.isFinite(census) || census < 1) return;
    setState((prev) => ({ ...prev, census: Math.round(census) }));
  }, []);

  const setInvoice = useCallback((total: number) => {
    if (!Number.isFinite(total) || total < 0) return;
    setState((prev) => ({ ...prev, invoiceTotal: Math.round(total) }));
  }, []);

  const setSupply = useCallback((id: string, count: number) => {
    if (!Number.isFinite(count) || count < 0) return;
    setState((prev) => ({
      ...prev,
      supplies: prev.supplies.map((s) =>
        s.id === id ? { ...s, count: Math.round(count) } : s,
      ),
    }));
  }, []);

  const addEvent = useCallback(
    (input: {
      title: string;
      kind: EventKind;
      startsAt: number;
      roomNumber: string | null;
    }) => {
      const title = input.title.trim();
      if (!title) return "Say what is happening.";
      if (!Number.isFinite(input.startsAt)) return "Pick a day.";
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        events: [
          {
            id: `ev-${now}`,
            title,
            kind: input.kind,
            startsAt: input.startsAt,
            roomNumber: input.roomNumber?.trim() || null,
          },
          ...prev.events,
        ],
      }));
      return null;
    },
    [],
  );

  const removeEvent = useCallback((id: string) => {
    let error: string | null = null;
    setState((prev) => {
      if (!prev.events.some((event) => event.id === id)) {
        error = "Unknown event.";
        return prev;
      }
      return {
        ...prev,
        events: prev.events.filter((event) => event.id !== id),
      };
    });
    return error;
  }, []);

  const reset = useCallback(() => {
    setState(seedState());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      setRole,
      setStaffId,
      toggleAccess,
      signIn,
      signOut,
      addEmployee,
      changeEmployeeRole,
      removeEmployee,
      currentStay,
      checkIn,
      checkOut,
      startClean,
      finishClean,
      addOrder,
      startOrder,
      serveOrder,
      logTemp,
      toggleChecklist,
      addFeedback,
      setCensus,
      setInvoice,
      setSupply,
      addEvent,
      removeEvent,
      reset,
    }),
    [
      state,
      ready,
      setRole,
      setStaffId,
      toggleAccess,
      signIn,
      signOut,
      addEmployee,
      changeEmployeeRole,
      removeEmployee,
      currentStay,
      checkIn,
      checkOut,
      startClean,
      finishClean,
      addOrder,
      startOrder,
      serveOrder,
      logTemp,
      toggleChecklist,
      addFeedback,
      setCensus,
      setInvoice,
      setSupply,
      addEvent,
      removeEvent,
      reset,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
