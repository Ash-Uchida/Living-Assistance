import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-lg space-y-8 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Check in. See the rooms.
        </h1>
        <p className="text-stone-600">
          A first look for the care center. Residents check themselves in and
          out. Staff see which rooms are open, occupied, or need cleaning. No
          medical notes.
        </p>
      </div>
      <div className="grid gap-3">
        <Link
          href="/check-in"
          className="rounded-2xl bg-stone-900 px-5 py-6 text-white transition hover:bg-stone-800"
        >
          <div className="text-lg font-medium">I am checking in or out</div>
          <div className="mt-1 text-sm text-stone-300">
            For residents. Name and room only.
          </div>
        </Link>
        <Link
          href="/board"
          className="rounded-2xl bg-white px-5 py-6 ring-1 ring-stone-300 transition hover:bg-stone-50"
        >
          <div className="text-lg font-medium">Staff room board</div>
          <div className="mt-1 text-sm text-stone-600">
            Live status for every room. Click a room for details.
          </div>
        </Link>
        <Link
          href="/calendar"
          className="rounded-2xl bg-white px-5 py-6 ring-1 ring-stone-300 transition hover:bg-stone-50"
        >
          <div className="text-lg font-medium">Calendar</div>
          <div className="mt-1 text-sm text-stone-600">
            Who is in each room, and maintenance due dates.
          </div>
        </Link>
      </div>
    </div>
  );
}
