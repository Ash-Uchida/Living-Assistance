"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatStayRange, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Card, Field, PageTitle, inputClass } from "@/components/ui";

export default function StayHistoryPage() {
  const store = useStore();
  const [roomNumber, setRoomNumber] = useState("all");

  const rows = useMemo(() => {
    return store.stays
      .filter((stay) => roomNumber === "all" || stay.roomNumber === roomNumber)
      .slice()
      .sort((a, b) => b.checkedInAt - a.checkedInAt);
  }, [store.stays, roomNumber]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/rooms"
        className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
      >
        <i className="fas fa-arrow-left" aria-hidden />
        Back to rooms
      </Link>

      <PageTitle
        icon="fa-table"
        title="Stay history"
        note="Every check-in and check-out, newest first. Room numbers only. Dates by day also live on Calendar."
      />

      <Card>
        <Field label="Room">
          <select
            className={`${inputClass} max-w-xs`}
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          >
            <option value="all">All rooms</option>
            {store.rooms.map((room) => (
              <option key={room.number} value={room.number}>
                {room.number}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-2 text-xs text-slate-500">
          {rows.length} {rows.length === 1 ? "stay" : "stays"}
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Room</th>
              <th className="px-4 py-3 font-bold">Stay</th>
              <th className="px-4 py-3 font-bold">Checked in</th>
              <th className="px-4 py-3 font-bold">Checked out</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No stays yet.
                </td>
              </tr>
            ) : (
              rows.map((stay) => (
                <tr
                  key={stay.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {stay.roomNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatStayRange(stay.startsOn, stay.endsOn)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatTime(stay.checkedInAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {stay.checkedOutAt ? formatTime(stay.checkedOutAt) : "Still in"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
