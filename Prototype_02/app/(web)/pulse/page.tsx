"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDays, dateKey } from "@/lib/dates";
import { formatDay, formatSpan } from "@/lib/format";
import {
  DEPARTMENT_DOT,
  dayRisks,
  feedbackSummary,
  periodRange,
  pulseRows,
  pulseStatus,
} from "@/lib/insights";
import type { Period, PulseRow } from "@/lib/insights";
import { roleHas } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { Card, LevelTag, Segmented } from "@/components/ui";

const BAR_COLOR = {
  bottleneck: "bg-rose-600",
  watch: "bg-amber-500",
  on_track: "bg-teal-700",
  no_data: "bg-slate-300",
};

function ratioText(ratio: number | null) {
  if (ratio === null) return "—";
  return `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×`;
}

export default function PulsePage() {
  const store = useStore();
  const now = useNow(60_000);
  const [period, setPeriod] = useState<Period>("week");
  const rows = useMemo(
    () => pulseRows(store, period, now).filter((row) => roleHas(store.access, store.role, row.module)),
    [store, period, now],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === picked) ?? rows[0];
  const feedback = useMemo(() => feedbackSummary(store, period, now), [store, period, now]);
  const range = periodRange(period, now);
  const periodWord = period === "week" ? "this week" : "this month";
  const canSeeRooms = roleHas(store.access, store.role, "residents");

  const comingUp = [0, 1, 2]
    .flatMap((offset) => {
      const key = dateKey(addDays(new Date(now), offset));
      return dayRisks(store, key, now).map((risk) => ({ ...risk, key }));
    })
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            {formatDay(range.from)} – {formatDay(range.to)} · compared with the {period === "week" ? "week" : "month"} before
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Weekly pulse</h1>
        </div>
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Where work gets stuck</h2>
            <p className="text-xs text-slate-500">Bar is time taken against the target (black line). Tap a row for details.</p>
          </div>
          <div className="hidden grid-cols-[180px_1fr_90px] gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
            <span>Process</span>
            <span className="relative flex justify-between">
              <span>0</span>
              <span className="absolute left-1/4 -translate-x-1/2 text-slate-700">Target</span>
              <span className="absolute left-1/2 -translate-x-1/2">2×</span>
              <span>4×+</span>
            </span>
            <span className="text-right">vs target</span>
          </div>
          <ul className="space-y-1">
            {rows.map((row) => {
              const status = pulseStatus(row.ratio);
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    aria-expanded={active}
                    onClick={() => setPicked(row.id)}
                    className={`grid w-full gap-2 rounded-xl px-3 py-2.5 text-left sm:grid-cols-[180px_1fr_90px] sm:items-center sm:gap-3 ${
                      active ? "bg-white ring-1 ring-teal-800" : "hover:bg-white"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{row.label}</span>
                      <span className="block text-[11px] text-slate-500">{row.summary}</span>
                    </span>
                    <span className="relative h-3 rounded-full bg-slate-200/70">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full ${BAR_COLOR[status]}`}
                        style={{ width: `${Math.min((row.ratio ?? 0) / 4, 1) * 100}%` }}
                      />
                      <span className="absolute -inset-y-1 left-1/4 w-0.5 bg-slate-900" aria-hidden />
                    </span>
                    <span className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                      <span className="text-sm font-bold text-slate-900">{ratioText(row.ratio)}</span>
                      <LevelTag level={status} />
                    </span>
                  </button>
                  {active ? <Breakdown row={row} className="mt-2 lg:hidden" /> : null}
                </li>
              );
            })}
          </ul>
          {selected ? <Breakdown row={selected} className="hidden lg:block" /> : null}
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">What residents are telling us</h2>
              <p className="text-xs text-slate-500">
                {feedback.concerns} concerns · {feedback.compliments} compliments {periodWord}
              </p>
            </div>
            {feedback.topics.length === 0 ? (
              <p className="text-sm text-slate-600">No concerns logged {periodWord}.</p>
            ) : (
              <ul className="space-y-2">
                {feedback.topics.map((t) => {
                  const max = feedback.topics[0].count || 1;
                  return (
                    <li key={t.topic} className="grid grid-cols-[130px_1fr_52px] items-center gap-2 text-xs">
                      <span className="text-slate-700">{t.label}</span>
                      <span className="h-2.5 rounded bg-slate-100">
                        <span
                          className="block h-full rounded bg-indigo-400"
                          style={{ width: `${(t.count / max) * 100}%` }}
                        />
                      </span>
                      <span className="text-right font-semibold text-slate-900">
                        {t.count}{" "}
                        <span className={t.change > 0 ? "text-rose-600" : t.change < 0 ? "text-teal-700" : "text-slate-400"}>
                          {t.change > 0 ? `+${t.change}` : t.change < 0 ? `${t.change}` : "0"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {feedback.latest.length ? (
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Latest comments</p>
                {feedback.latest.map((f) => (
                  <p key={f.id} className="font-serif text-sm italic text-slate-800">
                    “{f.text}” <span className="not-italic text-slate-500">— Room {f.roomNumber}</span>
                  </p>
                ))}
              </div>
            ) : null}
            {canSeeRooms ? (
              <Link
                href="/residents"
                className="inline-block rounded-lg border border-teal-800 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50"
              >
                See rooms that need a visit
              </Link>
            ) : null}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Coming up</h2>
              <Link href="/calendar" className="text-xs font-semibold text-teal-700">
                Open calendar
              </Link>
            </div>
            {comingUp.length === 0 ? (
              <p className="text-sm text-slate-600">No staffing or cleaning risks in the next 3 days.</p>
            ) : (
              <ul className="space-y-2">
                {comingUp.map((risk) => (
                  <li key={risk.id} className="grid grid-cols-[40px_10px_1fr] items-start gap-2 text-xs">
                    <span className="font-bold uppercase text-slate-500">
                      {new Date(`${risk.key}T12:00`).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className={`mt-1 h-2 w-2 rounded-full ${DEPARTMENT_DOT[risk.department]}`} />
                    <span className="text-slate-700">{risk.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Breakdown({ row, className = "" }: { row: PulseRow; className?: string }) {
  const known = row.stages.filter((s) => s.avg !== null);
  const worst = known.reduce<number>((max, s) => Math.max(max, s.avg ?? 0), 0);
  return (
    <section
      aria-label={`Where the time goes: ${row.label}`}
      className={`space-y-3 rounded-xl bg-slate-100 p-4 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Where the time goes: {row.label}</h3>
        <span className="text-[11px] text-slate-500">
          Target: {row.targetLabel} · {row.count} this period
          {row.previousRatio !== null ? ` · before: ${ratioText(row.previousRatio)}` : ""}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {row.stages.map((stage) => {
          const isWorst = stage.avg !== null && stage.avg === worst && known.length > 1;
          return (
            <div
              key={stage.label}
              className={`rounded-lg px-3 py-2 ${isWorst ? "bg-rose-700 text-white" : "bg-paper text-slate-900"}`}
            >
              <p className={`text-[11px] ${isWorst ? "text-rose-100" : "text-slate-500"}`}>{stage.label}</p>
              <p className="font-serif text-lg font-semibold">{stage.avg === null ? "—" : formatSpan(stage.avg)}</p>
            </div>
          );
        })}
      </div>
      <p className="flex gap-2 text-xs text-slate-700">
        <span className="h-fit rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-800">
          Try this
        </span>
        {row.tip}
      </p>
    </section>
  );
}
