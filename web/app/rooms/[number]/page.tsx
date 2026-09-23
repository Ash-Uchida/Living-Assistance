"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { fromDateInput, toDateInput } from "@/lib/dates";
import { formatDay, formatWhen, statusClass, statusLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function RoomPage() {
  const { number } = useParams<{ number: string }>();
  const {
    rooms,
    currentStay,
    checkOut,
    setRoomStatus,
    setExpectedOut,
    setMaintenanceDue,
    ready,
  } = useStore();

  if (!ready) return <p className="text-stone-500">Loading…</p>;

  const room = rooms.find((r) => r.number === number);
  const stay = currentStay(number);

  if (!room) {
    return (
      <p className="text-stone-600">
        Room not found.{" "}
        <Link href="/board" className="underline">
          Back to the board
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/board" className="text-sm text-stone-500 hover:text-stone-800">
        ← Room board
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Room {room.number}
        </h1>
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ring-1 ${statusClass[room.status]}`}
        >
          {statusLabel[room.status]}
        </span>
      </div>

      {stay ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div className="text-xs uppercase tracking-wide text-stone-500">
            Checked in
          </div>
          <div className="mt-1 text-lg font-medium">{stay.name}</div>
          <div className="mt-1 text-sm text-stone-600">
            Since {formatWhen(stay.checkedInAt)}
          </div>
          <label className="mt-3 block space-y-1 text-sm">
            <span className="text-stone-500">Expected to leave</span>
            <input
              type="date"
              value={stay.expectedOutAt ? toDateInput(stay.expectedOutAt) : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setExpectedOut(room.number, fromDateInput(e.target.value));
                }
              }}
              className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
            />
          </label>
        </div>
      ) : (
        <p className="text-sm text-stone-600">No one is in this room.</p>
      )}

      {room.maintenanceDueAt || room.status === "maintenance" ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div className="text-xs uppercase tracking-wide text-stone-500">
            Maintenance due
          </div>
          {room.maintenanceDueAt ? (
            <div className="mt-1 text-sm text-stone-700">
              {formatDay(room.maintenanceDueAt)}
            </div>
          ) : null}
          <label className="mt-3 block space-y-1 text-sm">
            <span className="text-stone-500">Due date</span>
            <input
              type="date"
              value={
                room.maintenanceDueAt ? toDateInput(room.maintenanceDueAt) : ""
              }
              onChange={(e) =>
                setMaintenanceDue(
                  room.number,
                  e.target.value ? fromDateInput(e.target.value) : null,
                )
              }
              className="w-full rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-stone-800"
            />
          </label>
        </div>
      ) : room.status === "available" ? (
        <label className="block space-y-1 text-sm">
          <span className="text-stone-500">Schedule maintenance by</span>
          <input
            type="date"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setMaintenanceDue(room.number, fromDateInput(e.target.value));
              }
            }}
            className="w-full rounded-xl bg-white px-3 py-2 ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-stone-800"
          />
        </label>
      ) : null}

      <div className="flex flex-col gap-2">
        {stay ? (
          <button
            type="button"
            onClick={() => checkOut(room.number)}
            className="rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Check out
          </button>
        ) : null}
        {room.status === "needs_cleaning" ? (
          <button
            type="button"
            onClick={() => setRoomStatus(room.number, "available")}
            className="rounded-xl bg-white py-2.5 text-sm ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Mark clean / available
          </button>
        ) : null}
        {room.status === "available" || room.status === "maintenance" ? (
          <button
            type="button"
            onClick={() =>
              setRoomStatus(
                room.number,
                room.status === "maintenance" ? "available" : "maintenance",
              )
            }
            className="rounded-xl bg-white py-2.5 text-sm ring-1 ring-stone-300 hover:bg-stone-50"
          >
            {room.status === "maintenance"
              ? "Maintenance finished"
              : "Mark maintenance"}
          </button>
        ) : null}
        {room.status === "available" ? (
          <Link
            href="/check-in"
            className="rounded-xl bg-white py-2.5 text-center text-sm ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Check someone in
          </Link>
        ) : null}
      </div>
    </div>
  );
}
