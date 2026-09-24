"use client";

import { formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Card, PageTitle } from "@/components/ui";

export default function ChecklistPage() {
  const store = useStore();

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle
        icon="fa-clipboard-check"
        title="End-of-shift checklist"
        note="Kitchen close-out. Do not put names or health notes in the last item."
      />
      <Card className="space-y-3">
        {store.checklist.map((item) => {
          const done = store.checklistDone.find((c) => c.itemId === item.id);
          const station = store.staff.find((s) => s.id === done?.stationId);
          return (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(done?.completedAt)}
                onChange={() => store.toggleChecklist(item.id)}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                {done?.completedAt ? (
                  <span className="text-xs text-slate-500">
                    {formatTime(done.completedAt)} · {station?.label}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </Card>
    </div>
  );
}
