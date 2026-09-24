"use client";

import { useState } from "react";
import {
  MEAL_LABEL,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  formatTime,
} from "@/lib/format";
import { useStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import {
  Badge,
  Card,
  GhostButton,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

const tone: Record<OrderStatus, "slate" | "amber" | "teal"> = {
  pending: "slate",
  preparing: "amber",
  served: "teal",
};

export default function KitchenPage() {
  const store = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const open = store.orders.filter((o) => o.status !== "served");
  const served = store.orders.filter((o) => o.status === "served");

  function itemName(id: string) {
    return store.menu.find((m) => m.id === id)?.name ?? id;
  }

  return (
    <div>
      <PageTitle
        icon="fa-utensils"
        title="Kitchen queue"
        note="Orders by room. Mark preparing, then served. Times are tap times."
      />
      {message ? <p className="mb-3 text-sm text-rose-700">{message}</p> : null}
      <div className="space-y-3">
        {open.length === 0 ? (
          <p className="text-sm text-slate-600">Queue is clear.</p>
        ) : (
          open.map((order) => (
            <Card
              key={order.id}
              className={`flex flex-wrap items-center justify-between gap-3 ${
                order.status === "preparing"
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div>
                <p className="font-semibold">
                  Room {order.roomNumber} · {itemName(order.itemId)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {MEAL_LABEL[order.meal]} · {ORDER_TYPE_LABEL[order.type]} ·{" "}
                  {formatTime(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={tone[order.status]}>
                  {ORDER_STATUS_LABEL[order.status]}
                </Badge>
                {order.status === "pending" ? (
                  <PrimaryButton
                    onClick={() => setMessage(store.startOrder(order.id))}
                  >
                    Start
                  </PrimaryButton>
                ) : (
                  <GhostButton
                    onClick={() => setMessage(store.serveOrder(order.id))}
                  >
                    Served
                  </GhostButton>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
      {served.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-slate-500">Served</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {served.map((order) => (
              <li key={order.id}>
                Room {order.roomNumber} · {itemName(order.itemId)} ·{" "}
                {order.servedAt ? formatTime(order.servedAt) : "—"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
