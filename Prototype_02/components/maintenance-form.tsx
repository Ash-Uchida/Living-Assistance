"use client";

import { FormEvent, useState } from "react";
import { shrinkImage } from "@/lib/files";
import { useStore } from "@/lib/store";
import type { MaintenancePriority } from "@/lib/types";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

const MAX_PHOTOS = 3;

export function MaintenanceForm({
  roomNumber: fixedRoom,
  cleanJobId,
  onSent,
}: {
  roomNumber?: string;
  cleanJobId?: string;
  onSent?: (message: string) => void;
}) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [roomNumber, setRoomNumber] = useState(fixedRoom ?? "");
  const [area, setArea] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("routine");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const room = MAX_PHOTOS - photos.length;
      const picked = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, room);
      const shrunk = await Promise.all(picked.map((f) => shrinkImage(f)));
      setPhotos((current) => [...current, ...shrunk].slice(0, MAX_PHOTOS));
    } catch {
      setError("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.addMaintenance({
      title,
      roomNumber: roomNumber || null,
      area,
      details,
      photos,
      priority,
      cleanJobId: cleanJobId ?? null,
    });
    if (result) {
      setError(result);
      return;
    }
    setTitle("");
    setArea("");
    setDetails("");
    setPhotos([]);
    setPriority("routine");
    if (!fixedRoom) setRoomNumber("");
    setError(null);
    onSent?.("Request sent to maintenance.");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="What is wrong">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Leaky faucet"
          required
        />
      </Field>
      {fixedRoom ? (
        <Field label="Where">
          <input className={inputClass} value={`Room ${fixedRoom}`} disabled />
        </Field>
      ) : (
        <Field label="Room">
          <select
            className={inputClass}
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          >
            <option value="">Not a room (common area)</option>
            {store.rooms.map((room) => (
              <option key={room.number} value={room.number}>
                {room.number}
              </option>
            ))}
          </select>
        </Field>
      )}
      {!fixedRoom && !roomNumber ? (
        <Field label="Area">
          <input
            className={inputClass}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Main lobby, 2nd floor hallway…"
          />
        </Field>
      ) : null}
      <Field label="Priority">
        <select
          className={inputClass}
          value={priority}
          onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Details (optional)">
          <textarea
            className={inputClass}
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What you saw. No resident names or health details."
          />
        </Field>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Field label={`Photos (up to ${MAX_PHOTOS})`}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            disabled={busy || photos.length >= MAX_PHOTOS}
            onChange={(e) => {
              void addPhotos(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
          />
        </Field>
        {photos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((current) => current.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 rounded-full bg-white px-1.5 text-xs font-bold text-rose-700 shadow"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
      <PrimaryButton type="submit" disabled={busy} className="sm:col-span-2">
        Send to maintenance
      </PrimaryButton>
    </form>
  );
}
