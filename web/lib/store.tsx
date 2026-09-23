"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { rangesOverlap, startOfDay, stayRange } from "./dates";
import { seedRooms, seedStays } from "./seed";
import type { Room, RoomStatus, Stay } from "./types";

const STORAGE_KEY = "care-center-demo-v2";

type State = {
  rooms: Room[];
  stays: Stay[];
};

type Store = State & {
  ready: boolean;
  checkIn: (
    name: string,
    roomNumber: string,
    expectedOutAt?: string | null,
  ) => string | null;
  scheduleStay: (
    name: string,
    roomNumber: string,
    checkedInAt: string,
    expectedOutAt: string,
  ) => string | null;
  checkOut: (roomNumber: string) => string | null;
  setRoomStatus: (roomNumber: string, status: RoomStatus) => string | null;
  setExpectedOut: (roomNumber: string, expectedOutAt: string) => string | null;
  setMaintenanceDue: (roomNumber: string, dueAt: string | null) => string | null;
  reset: () => void;
  currentStay: (roomNumber: string) => Stay | undefined;
};

const StoreContext = createContext<Store | null>(null);

function load(): State {
  return { rooms: seedRooms, stays: seedStays };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      /* keep seed */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const currentStay = useCallback(
    (roomNumber: string) =>
      state.stays.find((s) => s.room === roomNumber && !s.checkedOutAt),
    [state.stays],
  );

  const checkIn = useCallback(
    (name: string, roomNumber: string, expectedOutAt?: string | null) => {
      const trimmed = name.trim();
      if (!trimmed) return "Please enter a name.";

      let error: string | null = null;
      setState((prev) => {
        const room = prev.rooms.find((r) => r.number === roomNumber);
        if (!room) {
          error = "That room does not exist.";
          return prev;
        }
        if (room.status !== "available") {
          error = `Room ${roomNumber} is not available.`;
          return prev;
        }
        const leave =
          expectedOutAt ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        return {
          rooms: prev.rooms.map((r) =>
            r.number === roomNumber ? { ...r, status: "occupied" } : r,
          ),
          stays: [
            ...prev.stays,
            {
              id: crypto.randomUUID(),
              name: trimmed,
              room: roomNumber,
              checkedInAt: new Date().toISOString(),
              expectedOutAt: leave,
              checkedOutAt: null,
            },
          ],
        };
      });
      return error;
    },
    [],
  );

  const scheduleStay = useCallback(
    (
      name: string,
      roomNumber: string,
      checkedInAt: string,
      expectedOutAt: string,
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return "Please enter a name.";
      const start = startOfDay(checkedInAt);
      const end = startOfDay(expectedOutAt);
      if (end.getTime() <= start.getTime()) {
        return "Leave date must be after the start date.";
      }

      let error: string | null = null;
      setState((prev) => {
        const room = prev.rooms.find((r) => r.number === roomNumber);
        if (!room) {
          error = "That room does not exist.";
          return prev;
        }
        const clash = prev.stays.some((s) => {
          if (s.room !== roomNumber || s.checkedOutAt) return false;
          const range = stayRange(s);
          return rangesOverlap(start, end, range.start, range.end);
        });
        if (clash) {
          error = `Room ${roomNumber} is already booked on those days.`;
          return prev;
        }
        const startsTodayOrEarlier = start.getTime() <= startOfDay(new Date()).getTime();
        return {
          rooms: prev.rooms.map((r) =>
            r.number === roomNumber && startsTodayOrEarlier
              ? { ...r, status: "occupied" as const }
              : r,
          ),
          stays: [
            ...prev.stays,
            {
              id: crypto.randomUUID(),
              name: trimmed,
              room: roomNumber,
              checkedInAt,
              expectedOutAt,
              checkedOutAt: null,
            },
          ],
        };
      });
      return error;
    },
    [],
  );

  const checkOut = useCallback((roomNumber: string) => {
    let error: string | null = null;
    setState((prev) => {
      const stay = prev.stays.find(
        (s) => s.room === roomNumber && !s.checkedOutAt,
      );
      if (!stay) {
        error = `No one is checked into room ${roomNumber}.`;
        return prev;
      }
      return {
        rooms: prev.rooms.map((r) =>
          r.number === roomNumber ? { ...r, status: "needs_cleaning" } : r,
        ),
        stays: prev.stays.map((s) =>
          s.id === stay.id
            ? { ...s, checkedOutAt: new Date().toISOString() }
            : s,
        ),
      };
    });
    return error;
  }, []);

  const setRoomStatus = useCallback(
    (roomNumber: string, status: RoomStatus) => {
      let error: string | null = null;
      setState((prev) => {
        const stay = prev.stays.find(
          (s) => s.room === roomNumber && !s.checkedOutAt,
        );
        if (status !== "occupied" && stay) {
          error = "Check the resident out before changing this room.";
          return prev;
        }
        if (status === "occupied" && !stay) {
          error = "Use check-in to put someone in this room.";
          return prev;
        }
        return {
          ...prev,
          rooms: prev.rooms.map((r) => {
            if (r.number !== roomNumber) return r;
            if (status === "maintenance") {
              const due =
                r.maintenanceDueAt ??
                new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
              return { ...r, status, maintenanceDueAt: due };
            }
            if (r.status === "maintenance" && status !== "maintenance") {
              return { ...r, status, maintenanceDueAt: null };
            }
            return { ...r, status };
          }),
        };
      });
      return error;
    },
    [],
  );

  const setExpectedOut = useCallback(
    (roomNumber: string, expectedOutAt: string) => {
      let error: string | null = null;
      setState((prev) => {
        const stay = prev.stays.find(
          (s) => s.room === roomNumber && !s.checkedOutAt,
        );
        if (!stay) {
          error = `No one is checked into room ${roomNumber}.`;
          return prev;
        }
        return {
          ...prev,
          stays: prev.stays.map((s) =>
            s.id === stay.id ? { ...s, expectedOutAt } : s,
          ),
        };
      });
      return error;
    },
    [],
  );

  const setMaintenanceDue = useCallback(
    (roomNumber: string, dueAt: string | null) => {
      let error: string | null = null;
      setState((prev) => {
        const room = prev.rooms.find((r) => r.number === roomNumber);
        if (!room) {
          error = "That room does not exist.";
          return prev;
        }
        return {
          ...prev,
          rooms: prev.rooms.map((r) => {
            if (r.number !== roomNumber) return r;
            const dueTodayOrEarlier =
              dueAt != null &&
              startOfDay(dueAt).getTime() <= startOfDay(new Date()).getTime();
            return {
              ...r,
              maintenanceDueAt: dueAt,
              status:
                dueTodayOrEarlier && r.status === "available"
                  ? "maintenance"
                  : r.status,
            };
          }),
        };
      });
      return error;
    },
    [],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(load());
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      checkIn,
      scheduleStay,
      checkOut,
      setRoomStatus,
      setExpectedOut,
      setMaintenanceDue,
      reset,
      currentStay,
    }),
    [
      state,
      ready,
      checkIn,
      scheduleStay,
      checkOut,
      setRoomStatus,
      setExpectedOut,
      setMaintenanceDue,
      reset,
      currentStay,
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
