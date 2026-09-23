"use client";

import Link from "next/link";
import { statusClass, statusLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { RoomStatus } from "@/lib/types";

const legend: RoomStatus[] = [
  "available",
  "occupied",
  "needs_cleaning",
  "maintenance",
];

export default function BoardPage() {
  const { rooms, currentStay, reset, ready } = useStore();

  if (!ready) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Room board</h1>
          <p className="text-sm text-stone-600">
            Click a room. Occupied rooms show who is in them.
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

      <ul className="flex flex-wrap gap-2 text-xs">
        {legend.map((status) => (
          <li
            key={status}
            className={`rounded-full px-2.5 py-1 ring-1 ${statusClass[status]}`}
          >
            {statusLabel[status]}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rooms.map((room) => {
          const stay = currentStay(room.number);
          return (
            <Link
              key={room.number}
              href={`/rooms/${room.number}`}
              className={`rounded-2xl p-4 ring-1 transition hover:ring-stone-400 ${statusClass[room.status]}`}
            >
              <div className="text-lg font-semibold">Room {room.number}</div>
              <div className="mt-1 text-sm">{statusLabel[room.status]}</div>
              {stay ? (
                <div className="mt-2 text-sm font-medium">{stay.name}</div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
