"use client";

import { useState } from "react";
import { MEAL_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Meal, Thumbs } from "@/lib/types";
import { Card, Field, inputClass, PageTitle, PrimaryButton } from "@/components/ui";

export default function SurveyPage() {
  const store = useStore();
  const [meal, setMeal] = useState<Meal>("lunch");
  const [itemId, setItemId] = useState(
    store.menu.find((m) => m.meal === "lunch")?.id ?? "",
  );
  const [picked, setPicked] = useState<Thumbs | null>(null);
  const items = store.menu.filter((m) => m.meal === meal);

  function submit() {
    if (!picked) return;
    store.addFeedback(meal, itemId, picked);
    setPicked(null);
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle
        icon="fa-thumbs-up"
        title="Meal survey"
        note="Pick a thumb, then submit. Repeat thumbs-down show up for the dining manager."
      />
      <Card className="space-y-5">
        <Field label="Meal">
          <select
            className={inputClass}
            value={meal}
            onChange={(e) => {
              const next = e.target.value as Meal;
              setMeal(next);
              setItemId(store.menu.find((m) => m.meal === next)?.id ?? "");
              setPicked(null);
            }}
          >
            {(Object.keys(MEAL_LABEL) as Meal[]).map((m) => (
              <option key={m} value={m}>
                {MEAL_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Item">
          <select
            className={inputClass}
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setPicked(null);
            }}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <ThumbButton
            kind="up"
            selected={picked === "up"}
            onClick={() => setPicked("up")}
          />
          <ThumbButton
            kind="down"
            selected={picked === "down"}
            onClick={() => setPicked("down")}
          />
        </div>
        <PrimaryButton
          type="button"
          className="w-full"
          disabled={!picked}
          onClick={submit}
        >
          Submit
        </PrimaryButton>
      </Card>
    </div>
  );
}

function ThumbButton({
  kind,
  selected,
  onClick,
}: {
  kind: Thumbs;
  selected: boolean;
  onClick: () => void;
}) {
  const up = kind === "up";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={up ? "Thumbs up" : "Thumbs down"}
      aria-pressed={selected}
      className={`flex aspect-square items-center justify-center rounded-3xl border-2 transition ${
        up
          ? selected
            ? "border-emerald-600 bg-emerald-100"
            : "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100"
          : selected
            ? "border-rose-600 bg-rose-100"
            : "border-rose-200 bg-rose-50 hover:border-rose-400 hover:bg-rose-100"
      }`}
    >
      <i
        className={`fas text-7xl sm:text-8xl ${
          up ? "fa-thumbs-up text-emerald-600" : "fa-thumbs-down text-rose-600"
        }`}
        aria-hidden
      />
    </button>
  );
}
