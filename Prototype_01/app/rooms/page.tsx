"use client";

import { useState } from "react";
import Link from "next/link";
import { addDays, dateKey } from "@/lib/dates";
import { OCCUPANCY_LABEL, formatStayRange, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Occupancy } from "@/lib/types";
import {
  Badge,
  Card,
  FilterChip,
  GhostButton,
  inputClass,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

const tone: Record<Occupancy, "slate" | "teal" | "amber"> = {
  vacant: "slate",
  occupied: "teal",
  needs_cleaning: "amber",
};

export default function RoomsPage() {
  const store = useStore();
  const vacant = store.rooms.filter((r) => r.occupancy === "vacant");
  const occupied = store.rooms.filter((r) => r.occupancy === "occupied");
  const dirty = store.rooms.filter((r) => r.occupancy === "needs_cleaning");
  const [roomNumber, setRoomNumber] = useState(vacant[0]?.number ?? "");
  const [startsOn, setStartsOn] = useState(() => dateKey(new Date()));
  const [endsOn, setEndsOn] = useState(() =>
    dateKey(addDays(new Date(), 7)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Occupancy>("all");
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const rows = store.rooms.filter(
    (room) => filter === "all" || room.occupancy === filter,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          icon="fa-door-open"
          title="Rooms"
          note="Check a room in with stay dates. Click a room to see its check-in and check-out history. No names."
        />
        <div className="mb-5 flex gap-2">
          <Stat label="In" value={occupied.length} />
          <Stat label="Open" value={vacant.length} />
          <Stat label="To clean" value={dirty.length} />
        </div>
      </div>

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const error = store.checkIn(roomNumber, startsOn, endsOn);
            if (error) {
              setMessage(error);
              return;
            }
            setMessage(`Room ${roomNumber} is occupied ${formatStayRange(startsOn, endsOn)}.`);
            const next = vacant.find((r) => r.number !== roomNumber);
            setRoomNumber(next?.number ?? "");
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Check in a room
            </span>
            <select
              className={inputClass}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            >
              {vacant.length === 0 ? (
                <option value="">None open</option>
              ) : (
                vacant.map((room) => (
                  <option key={room.number} value={room.number}>
                    {room.number}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Stay starts
            </span>
            <input
              className={inputClass}
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Stay ends
            </span>
            <input
              className={inputClass}
              type="date"
              value={endsOn}
              min={startsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              required
            />
          </label>
          <PrimaryButton type="submit" disabled={!roomNumber} className="h-[42px]">
            Check in
          </PrimaryButton>
        </form>
        {message ? (
          <p className="mt-3 text-xs font-semibold text-teal-800">{message}</p>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Room board</h2>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All {store.rooms.length}
            </FilterChip>
            <FilterChip
              active={filter === "occupied"}
              onClick={() => setFilter("occupied")}
            >
              In {occupied.length}
            </FilterChip>
            <FilterChip
              active={filter === "vacant"}
              onClick={() => setFilter("vacant")}
            >
              Open {vacant.length}
            </FilterChip>
            <FilterChip
              active={filter === "needs_cleaning"}
              onClick={() => setFilter("needs_cleaning")}
            >
              To clean {dirty.length}
            </FilterChip>
          </div>
        </div>

        <div className="hidden grid-cols-[5rem_8rem_1fr_7rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Room</span>
          <span>Status</span>
          <span>Stay</span>
          <span className="text-right">Action</span>
        </div>

        <ul>
          {rows.map((room, index) => {
            const stay = store.currentStay(room.number);
            const history = store.stays
              .filter((item) => item.roomNumber === room.number)
              .sort((a, b) => b.checkedInAt - a.checkedInAt);
            const open = openRoom === room.number;
            return (
              <li
                key={room.number}
                className={index < rows.length - 1 ? "border-b border-slate-100" : ""}
              >
                <div className="grid grid-cols-2 items-center gap-2 px-4 py-3 sm:grid-cols-[5rem_8rem_1fr_7rem]">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRoom((current) =>
                        current === room.number ? null : room.number,
                      )
                    }
                    className="text-left font-bold text-slate-900 hover:text-teal-800"
                  >
                    {room.number}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRoom((current) =>
                        current === room.number ? null : room.number,
                      )
                    }
                    className="text-left"
                  >
                    <Badge tone={tone[room.occupancy]}>
                      {OCCUPANCY_LABEL[room.occupancy]}
                    </Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRoom((current) =>
                        current === room.number ? null : room.number,
                      )
                    }
                    className="text-left text-sm text-slate-600"
                  >
                    {stay
                      ? formatStayRange(stay.startsOn, stay.endsOn)
                      : room.occupancy === "needs_cleaning"
                        ? "Waiting on deep clean"
                        : history.length
                          ? "Open history"
                          : "—"}
                  </button>
                  <div className="text-right">
                    {room.occupancy === "occupied" ? (
                      <GhostButton
                        onClick={() =>
                          setMessage(
                            store.checkOut(room.number) ??
                              `Room ${room.number} checked out. Deep clean sent to housekeeping.`,
                          )
                        }
                      >
                        Check out
                      </GhostButton>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                </div>
                {open ? (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      History for room {room.number}
                    </p>
                    {history.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        No check-ins yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {history.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                          >
                            <p className="font-semibold text-slate-900">
                              {formatStayRange(item.startsOn, item.endsOn)}
                            </p>
                            <p className="text-xs text-slate-500">
                              In {formatTime(item.checkedInAt)}
                              {item.checkedOutAt
                                ? ` · Out ${formatTime(item.checkedOutAt)}`
                                : " · Still in"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Link
        href="/rooms/history"
        className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-400"
      >
        <span>All stay history</span>
        <span className="text-xs font-medium text-teal-700">
          Spreadsheet view →
        </span>
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[4.5rem] rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
