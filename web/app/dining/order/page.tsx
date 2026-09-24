"use client";

import { useState } from "react";
import { MEAL_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Meal, OrderType } from "@/lib/types";
import {
  Card,
  Field,
  inputClass,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

export default function OrderPage() {
  const store = useStore();
  const [roomNumber, setRoomNumber] = useState(store.rooms[0]?.number ?? "");
  const [meal, setMeal] = useState<Meal>("lunch");
  const [itemId, setItemId] = useState(
    store.menu.find((m) => m.meal === "lunch")?.id ?? "",
  );
  const [type, setType] = useState<OrderType>("dine_in");
  const [message, setMessage] = useState<string | null>(null);
  const items = store.menu.filter((m) => m.meal === meal);

  function onMeal(next: Meal) {
    setMeal(next);
    const first = store.menu.find((m) => m.meal === next);
    setItemId(first?.id ?? "");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle
        icon="fa-utensils"
        title="Take an order"
        note="Room, meal, menu choice, and how it is served. No names or diets."
      />
      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const error = store.addOrder({ roomNumber, meal, itemId, type });
            setMessage(error ?? `Order sent for room ${roomNumber}.`);
          }}
        >
          <Field label="Room">
            <select
              className={inputClass}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            >
              {store.rooms.map((room) => (
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
            </select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Type</legend>
            {(
              [
                ["dine_in", "Dine-in"],
                ["tray", "Tray"],
                ["to_go", "To-go"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={type === value}
                  onChange={() => setType(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <PrimaryButton type="submit">Send to kitchen</PrimaryButton>
          {message ? (
            <p className="text-sm text-teal-800">{message}</p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
