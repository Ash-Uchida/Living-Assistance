"use client";

import { dateKey } from "@/lib/dates";
import { MEAL_LABEL, ORDER_TYPE_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { OrderType } from "@/lib/types";
import { Card, PageTitle } from "@/components/ui";

const TYPE_HINT: Record<OrderType, string> = {
  dine_in: "Ate in the dining room",
  to_go: "To-go tray to the room",
};

export default function DiningManagerPage() {
  const store = useStore();
  const today = dateKey(useNow(60_000));
  const todays = store.orders.filter((o) => dateKey(o.createdAt) === today);
  const typeCounts = todays.reduce(
    (acc, order) => {
      acc[order.type] += 1;
      return acc;
    },
    { dine_in: 0, to_go: 0 } as Record<OrderType, number>,
  );
  const totalOrders = todays.length;
  const downs = store.feedback.filter((f) => f.thumbs === "down");
  const downByItem = downs.reduce<Record<string, number>>((acc, f) => {
    acc[f.itemId] = (acc[f.itemId] ?? 0) + 1;
    return acc;
  }, {});
  const flagged = Object.entries(downByItem)
    .filter(([, n]) => n >= 2)
    .map(([itemId, n]) => {
      const item = store.menu.find((m) => m.id === itemId);
      return {
        id: itemId,
        name: item?.name ?? itemId,
        meal: item?.meal ?? "lunch",
        n,
      };
    });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageTitle
        icon="fa-chart-pie"
        title="Dining counts"
        note="How this meal went. The Sysco bill and shelf counts stay off this screen — that is a later weekly job, not a shift job."
      />

      <section>
        <h2 className="mb-1 text-sm font-bold text-slate-900">
          How meals were served
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          From Take order. {totalOrders}{" "}
          {totalOrders === 1 ? "order" : "orders"} today. Trends over time are on Weekly pulse.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(ORDER_TYPE_LABEL) as OrderType[]).map((type) => (
            <Card key={type}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {ORDER_TYPE_LABEL[type]}
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {typeCounts[type]}
              </p>
              <p className="mt-1 text-xs text-slate-500">{TYPE_HINT[type]}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-bold text-slate-900">
          What people disliked
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          From Meal survey. A dish shows up only if it got two or more thumbs
          down.
        </p>
        <Card>
          {flagged.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nothing has two thumbs down yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {flagged.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {MEAL_LABEL[item.meal]}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-rose-800">
                    {item.n} thumbs down
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
