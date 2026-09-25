"use client";

import { FormEvent, useState } from "react";
import { readAsDataUrl, shrinkImage } from "@/lib/files";
import { MEAL_LABEL, formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Meal } from "@/lib/types";
import {
  Card,
  FilterChip,
  GhostButton,
  PageTitle,
  PrimaryButton,
  inputClass,
} from "@/components/ui";

const MAX_PDF_BYTES = 1_500_000;

export default function MenusPage() {
  const store = useStore();
  const [meal, setMeal] = useState<Meal>("lunch");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const items = store.menu.filter((m) => m.meal === meal);
  const file = store.menuFiles.find((f) => f.meal === meal);

  async function upload(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    setBusy(true);
    setMessage(null);
    try {
      if (picked.type === "application/pdf") {
        if (picked.size > MAX_PDF_BYTES) {
          setMessage("That PDF is too big for the demo. Use a photo or a smaller PDF.");
          return;
        }
        store.setMenuFile({
          meal,
          fileName: picked.name,
          kind: "pdf",
          dataUrl: await readAsDataUrl(picked),
          uploadedAt: Date.now(),
        });
      } else if (picked.type.startsWith("image/")) {
        store.setMenuFile({
          meal,
          fileName: picked.name,
          kind: "image",
          dataUrl: await shrinkImage(picked, 1600, 0.8),
          uploadedAt: Date.now(),
        });
      } else {
        setMessage("Upload a photo or a PDF of the menu.");
        return;
      }
      setMessage(`${MEAL_LABEL[meal]} menu uploaded.`);
    } catch {
      setMessage("Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    const error = store.addMenuItem(meal, name);
    if (error) {
      setMessage(error);
      return;
    }
    setName("");
    setMessage(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageTitle
        icon="fa-book-open"
        title="Menus"
        note="Upload the printed menu for each meal and list the dishes staff can order from."
      />

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MEAL_LABEL) as Meal[]).map((m) => (
          <FilterChip key={m} active={meal === m} onClick={() => setMeal(m)}>
            {MEAL_LABEL[m]} {store.menu.filter((i) => i.meal === m).length}
          </FilterChip>
        ))}
      </div>

      {message ? <p className="text-sm font-semibold text-teal-800">{message}</p> : null}
      {store.saveError ? <p className="text-sm text-rose-700">{store.saveError}</p> : null}

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">{MEAL_LABEL[meal]} menu file</h2>
          {file ? (
            <GhostButton onClick={() => store.removeMenuFile(meal)}>Remove file</GhostButton>
          ) : null}
        </div>
        {file ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {file.fileName} · uploaded {formatDateTime(file.uploadedAt)}
            </p>
            {file.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.dataUrl}
                alt={`${MEAL_LABEL[meal]} menu`}
                className="max-h-96 rounded-xl border border-slate-200"
              />
            ) : (
              <a
                href={file.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
              >
                <i className="fas fa-file-pdf" aria-hidden />
                Open PDF
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No file for {MEAL_LABEL[meal].toLowerCase()} yet.</p>
        )}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700">
            {file ? "Replace menu file" : "Upload menu file"}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
          />
        </label>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">{MEAL_LABEL[meal]} dishes</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No dishes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-900">{item.name}</span>
                <button
                  type="button"
                  onClick={() => store.removeMenuItem(item.id)}
                  className="text-xs font-semibold text-rose-700"
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addItem} className="flex gap-2">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New dish"
            aria-label="New dish"
          />
          <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
