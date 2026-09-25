"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  Card,
  Field,
  inputClass,
  PageTitle,
  PrimaryButton,
} from "@/components/ui";

export default function TempsPage() {
  const store = useStore();
  const [fridgeId, setFridgeId] = useState(store.fridges[0]?.id ?? "");
  const [temp, setTemp] = useState("38");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle
        icon="fa-temperature-half"
        title="Fridge temperatures"
        note="Append-only log. Station and time are recorded. Entries cannot be silently edited."
      />
      <Card className="mb-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const error = store.logTemp(fridgeId, Number(temp));
            setMessage(error ?? "Logged.");
          }}
        >
          <Field label="Fridge">
            <select
              className={inputClass}
              value={fridgeId}
              onChange={(e) => setFridgeId(e.target.value)}
            >
              {store.fridges.map((fridge) => (
                <option key={fridge.id} value={fridge.id}>
                  {fridge.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temperature (°F)">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
            />
          </Field>
          <PrimaryButton type="submit">Log temperature</PrimaryButton>
          {message ? <p className="text-sm text-teal-800">{message}</p> : null}
        </form>
      </Card>
      <ul className="space-y-2">
        {store.temps.map((log) => {
          const fridge = store.fridges.find((f) => f.id === log.fridgeId);
          const station = store.staff.find((s) => s.id === log.stationId);
          const outOfRange = log.tempF < 33 || log.tempF > 41;
          return (
            <li key={log.id}>
              <Card className={outOfRange ? "ring-rose-300" : ""}>
                <p className="font-medium">
                  {fridge?.label ?? log.fridgeId}: {log.tempF}°F
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatTime(log.recordedAt)} · {station?.label ?? log.stationId}
                  {outOfRange ? " · outside 33–41°F" : ""}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
