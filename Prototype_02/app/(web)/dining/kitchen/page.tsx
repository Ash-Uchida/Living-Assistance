"use client";

import { useState } from "react";
import { dateKey } from "@/lib/dates";
import {
  MEAL_LABEL,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  formatTime,
} from "@/lib/format";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { MealOrder, OrderStatus } from "@/lib/types";
import { Badge, Card, GhostButton, PageTitle, PrimaryButton } from "@/components/ui";

const tone: Record<OrderStatus, "slate" | "amber" | "emerald" | "teal"> = {
  pending: "slate",
  preparing: "amber",
  ready: "emerald",
  complete: "teal",
};

export default function KitchenPage() {
  const store = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const now = useNow(60_000);

  const incoming = store.orders
    .filter((o) => o.status === "pending" || o.status === "preparing")
    .sort((a, b) => a.createdAt - b.createdAt);
  const specials = incoming.filter((o) => o.special);
  const regular = incoming.filter((o) => !o.special);
  const ready = store.orders.filter((o) => o.status === "ready");
  const today = dateKey(now);
  const complete = store.orders
    .filter((o) => o.status === "complete" && o.completedAt && dateKey(o.completedAt) === today)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 8);

  function itemName(order: MealOrder) {
    if (!order.itemId) return "Special order";
    return store.menu.find((m) => m.id === order.itemId)?.name ?? "Menu item";
  }

  function renderOrder(order: MealOrder) {
    return (
      <Card
        key={order.id}
        className={`flex flex-wrap items-center justify-between gap-3 ${
          order.special
            ? "border-rose-200 bg-rose-50/40"
            : order.status === "preparing"
              ? "border-amber-200 bg-amber-50/40"
              : ""
        }`}
      >
        <div>
          <p className="font-semibold">
            Room {order.roomNumber} · {itemName(order)}
          </p>
          {order.special ? (
            <p className="mt-0.5 text-sm font-semibold text-rose-800">“{order.special}”</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-600">
            {MEAL_LABEL[order.meal]} · {ORDER_TYPE_LABEL[order.type]} · in at{" "}
            {formatTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          {order.status === "pending" ? (
            <GhostButton onClick={() => setMessage(store.startOrder(order.id))}>Start</GhostButton>
          ) : null}
          <PrimaryButton onClick={() => setMessage(store.readyOrder(order.id))}>
            Ready — alert staff
          </PrimaryButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        icon="fa-fire-burner"
        title="Kitchen queue"
        note="Special orders first, then everything else oldest first. Mark ready to alert the nurse station; mark complete once it leaves the kitchen."
      />
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-rose-800">Special orders ({specials.length})</h2>
        {specials.length === 0 ? (
          <p className="text-sm text-slate-600">No special orders.</p>
        ) : (
          specials.map(renderOrder)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Incoming ({regular.length})</h2>
        {regular.length === 0 ? (
          <p className="text-sm text-slate-600">Queue is clear.</p>
        ) : (
          regular.map(renderOrder)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-emerald-800">Ready, waiting for pickup ({ready.length})</h2>
        {ready.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing waiting.</p>
        ) : (
          <ul className="space-y-2">
            {ready.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm"
              >
                <span>
                  Room {order.roomNumber} · {itemName(order)} · {ORDER_TYPE_LABEL[order.type]}
                </span>
                <GhostButton onClick={() => setMessage(store.completeOrder(order.id))}>
                  Complete
                </GhostButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      {complete.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-500">Complete</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {complete.map((order) => (
              <li key={order.id}>
                Room {order.roomNumber} · {itemName(order)} ·{" "}
                {order.completedAt ? formatTime(order.completedAt) : "—"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
