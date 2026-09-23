"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { seedRooms, seedStays } from "./seed";
import type { Room, RoomStatus, Stay } from "./types";

const STORAGE_KEY = "care-center-demo-v1";

type State = {
  rooms: Room[];
  stays: Stay[];
};

type Store = State & {
  ready: boolean;
  checkIn: (name: string, roomNumber: string) => string | null;
  checkOut: (roomNumber: string) => string | null;
  setRoomStatus: (roomNumber: string, status: RoomStatus) => string | null;
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

  const checkIn = useCallback((name: string, roomNumber: string) => {
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
            checkedOutAt: null,
          },
        ],
      };
    });
    return error;
  }, []);

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
          rooms: prev.rooms.map((r) =>
            r.number === roomNumber ? { ...r, status } : r,
          ),
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
      checkOut,
      setRoomStatus,
      reset,
      currentStay,
    }),
    [state, ready, checkIn, checkOut, setRoomStatus, reset, currentStay],
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
