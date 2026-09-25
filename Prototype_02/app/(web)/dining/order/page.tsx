"use client";

import { useState } from "react";
import { MEAL_LABEL, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { MealOrder, Meal, OrderType } from "@/lib/types";
import {
  Badge,
  Card,
  Field,
  GhostButton,
  inputClass,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

const SPECIAL = "special";

export default function OrderPage() {
  const store = useStore();
  const occupied = store.rooms.filter((r) => r.occupancy === "occupied");
  const [roomNumber, setRoomNumber] = useState(occupied[0]?.number ?? "");
  const [meal, setMeal] = useState<Meal>("lunch");
  const [itemId, setItemId] = useState(
    store.menu.find((m) => m.meal === "lunch")?.id ?? SPECIAL,
  );
  const [special, setSpecial] = useState("");
  const [type, setType] = useState<OrderType>("dine_in");
  const [message, setMessage] = useState<string | null>(null);
  const items = store.menu.filter((m) => m.meal === meal);

  const ready = store.orders.filter((o) => o.status === "ready");
  const waiting = store.orders.filter((o) => o.status === "pending" || o.status === "preparing");

  function itemName(order: MealOrder) {
    if (!order.itemId) return "Special order";
    return store.menu.find((m) => m.id === order.itemId)?.name ?? "Menu item";
  }

  function onMeal(next: Meal) {
    setMeal(next);
    setItemId(store.menu.find((m) => m.meal === next)?.id ?? SPECIAL);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_1fr]">
      <div>
        <PageTitle
          icon="fa-utensils"
          title="Take an order"
          note="Room, meal, dine in or to-go tray. Special requests go straight to the kitchen. No names or diets."
        />
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const error = store.addOrder({
                roomNumber,
                meal,
                itemId: itemId === SPECIAL ? null : itemId,
                special,
                type,
              });
              if (error) {
                setMessage(error);
                return;
              }
              setSpecial("");
              setMessage(`Order sent for room ${roomNumber}.`);
            }}
          >
            <Field label="Room">
              <select
                className={inputClass}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              >
                {occupied.length === 0 ? <option value="">No rooms checked in</option> : null}
                {occupied.map((room) => (
                  <option key={room.number} value={room.number}>
                    {room.number}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Meal">
              <select
                className={inputClass}
                value={meal}
                onChange={(e) => onMeal(e.target.value as Meal)}
              >
                {(Object.keys(MEAL_LABEL) as Meal[]).map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            {store.menuFiles.some((f) => f.meal === meal) ? (
              <a
                href={store.menuFiles.find((f) => f.meal === meal)?.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700"
              >
                <i className="fas fa-book-open" aria-hidden />
                View {MEAL_LABEL[meal].toLowerCase()} menu
              </a>
            ) : null}
            <Field label="Choice">
              <select
                className={inputClass}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
                <option value={SPECIAL}>Special order (off the menu)</option>
              </select>
            </Field>
            <Field label={itemId === SPECIAL ? "Special order" : "Special request (optional)"}>
              <input
                className={inputClass}
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder={
                  itemId === SPECIAL ? "Grilled cheese, crust cut off" : "Extra gravy, no onions"
                }
                required={itemId === SPECIAL}
              />
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-slate-700">How it is served</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ORDER_TYPE_LABEL) as OrderType[]).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${
                      type === value
                        ? "border-teal-600 bg-teal-50 text-teal-900"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      className="sr-only"
                      checked={type === value}
                      onChange={() => setType(value)}
                    />
                    <i
                      className={`fas ${value === "dine_in" ? "fa-chair" : "fa-bag-shopping"}`}
                      aria-hidden
                    />
                    {ORDER_TYPE_LABEL[value]}
                  </label>
                ))}
              </div>
            </fieldset>
            <PrimaryButton type="submit" disabled={!roomNumber}>
              Send to kitchen
            </PrimaryButton>
            {message ? <p className="text-sm text-teal-800">{message}</p> : null}
          </form>
        </Card>
      </div>

      <div className="space-y-4 lg:pt-12">
        <Card className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Ready for pickup</h2>
          {ready.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing ready yet.</p>
          ) : (
            <ul className="space-y-2">
              {ready.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Room {order.roomNumber} · {itemName(order)}
                    </p>
                    <p className="text-xs text-slate-600">
                      {ORDER_TYPE_LABEL[order.type]} · ready{" "}
                      {order.readyAt ? formatTime(order.readyAt) : ""}
                    </p>
                  </div>
                  <GhostButton onClick={() => setMessage(store.completeOrder(order.id))}>
                    Picked up
                  </GhostButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">In the kitchen</h2>
          {waiting.length === 0 ? (
            <p className="text-sm text-slate-600">No orders waiting.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {waiting.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3">
                  <span>
                    Room {order.roomNumber} · {itemName(order)}
                  </span>
                  <Badge tone={order.status === "preparing" ? "amber" : "slate"}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
