"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, dateKey } from "@/lib/dates";
import { formatWhen } from "@/lib/format";
import { useStore } from "@/lib/store";

function defaultLeave() {
  return dateKey(addDays(new Date(), 7));
}

export default function CheckInPage() {
  const { rooms, stays, checkIn, checkOut, ready } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [leaveOn, setLeaveOn] = useState(defaultLeave);
  const [error, setError] = useState<string | null>(null);

  const available = rooms.filter((r) => r.status === "available");
  const current = stays.filter((s) => !s.checkedOutAt);

  function onCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const leave = new Date(`${leaveOn}T12:00:00`).toISOString();
    const message = checkIn(name, room, leave);
    if (message) {
      setError(message);
      return;
    }
    router.push(`/rooms/${room}`);
  }

  if (!ready) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="mx-auto grid max-w-2xl gap-10 md:grid-cols-2">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Check in</h1>
        <form onSubmit={onCheckIn} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-stone-600">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-stone-800"
              autoComplete="name"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-stone-600">Room</span>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-stone-800"
              required
            >
              <option value="">Choose an open room</option>
              {available.map((r) => (
                <option key={r.number} value={r.number}>
                  Room {r.number}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-stone-600">Expected to leave</span>
            <input
              type="date"
              value={leaveOn}
              onChange={(e) => setLeaveOn(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-stone-800"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Check in
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Check out</h2>
        {current.length === 0 ? (
          <p className="text-sm text-stone-600">No one is checked in.</p>
        ) : (
          <ul className="space-y-2">
            {current.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-stone-200"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-stone-500">
                    Room {s.room} · in since {formatWhen(s.checkedInAt)}
                    {s.expectedOutAt
                      ? ` · until ${formatWhen(s.expectedOutAt)}`
                      : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const message = checkOut(s.room);
                    if (message) setError(message);
                  }}
                  className="shrink-0 rounded-lg bg-stone-100 px-3 py-1.5 text-sm hover:bg-stone-200"
                >
                  Check out
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
