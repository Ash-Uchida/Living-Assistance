"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatTime, statusClass, statusLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { RoomStatus } from "@/lib/types";

const statuses: RoomStatus[] = [
  "available",
  "occupied",
  "needs_cleaning",
  "maintenance",
];

type Filter = "all" | RoomStatus;

const attentionOrder: Record<RoomStatus, number> = {
  needs_cleaning: 0,
  maintenance: 1,
  occupied: 2,
  available: 3,
};

export default function BoardPage() {
  const { rooms, currentStay, reset, ready } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const next = { all: rooms.length } as Record<Filter, number>;
    for (const status of statuses) {
      next[status] = rooms.filter((r) => r.status === status).length;
    }
    return next;
  }, [rooms]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms
      .filter((room) => (filter === "all" ? true : room.status === filter))
      .map((room) => ({ room, stay: currentStay(room.number) }))
      .filter(({ room, stay }) => {
        if (!q) return true;
        return (
          room.number.includes(q) ||
          (stay?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        const byStatus =
          attentionOrder[a.room.status] - attentionOrder[b.room.status];
        if (byStatus !== 0) return byStatus;
        return a.room.number.localeCompare(b.room.number, undefined, {
          numeric: true,
        });
      });
  }, [rooms, filter, query, currentStay]);

  if (!ready) return <p className="text-stone-500">Loading…</p>;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...statuses.map((status) => ({
      key: status,
      label: statusLabel[status],
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Room board</h1>
          <p className="text-sm text-stone-600">
            Cleaning and maintenance sit at the top. Click a row for details.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-stone-500 underline-offset-2 hover:underline"
        >
          Reset demo
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {filters.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-2.5 py-1 text-xs ring-1 ${
                  key === "all"
                    ? active
                      ? "bg-stone-900 text-white ring-stone-900"
                      : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"
                    : `${statusClass[key]} ${active ? "ring-2" : "opacity-80 hover:opacity-100"}`
                }`}
              >
                {label} {counts[key]}
              </button>
            );
          })}
        </div>
        <label className="block flex-1 text-sm sm:max-w-xs">
          <span className="sr-only">Find a room or name</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find room or name"
            className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-stone-800"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 font-medium">Room</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Resident</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">
                In since
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-stone-500">
                  No rooms match.
                </td>
              </tr>
            ) : (
              rows.map(({ room, stay }) => (
                <tr key={room.number} className="border-t border-stone-100">
                  <td className="p-0" colSpan={4}>
                    <Link
                      href={`/rooms/${room.number}`}
                      className="grid grid-cols-[4.5rem_1fr_1fr] items-center gap-0 px-3 py-2.5 hover:bg-stone-50 sm:grid-cols-[4.5rem_10rem_1fr_7rem]"
                    >
                      <span className="font-semibold tabular-nums">
                        {room.number}
                      </span>
                      <span
                        className={`w-fit rounded-full px-2 py-0.5 text-xs ring-1 ${statusClass[room.status]}`}
                      >
                        {statusLabel[room.status]}
                      </span>
                      <span className={stay ? "text-stone-900" : "text-stone-400"}>
                        {stay?.name ?? "—"}
                      </span>
                      <span className="hidden text-stone-500 sm:block">
                        {stay ? formatTime(stay.checkedInAt) : "—"}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
