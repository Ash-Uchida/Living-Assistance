import { cloneElement, useId } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import type { LinkTone } from "@/lib/seed";

export function PageTitle({
  title,
  note,
  icon = "fa-th-large",
}: {
  title: string;
  note?: string;
  icon?: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <i className={`fas ${icon} text-teal-600`} aria-hidden />
        {title}
      </h1>
      {note ? <p className="mt-0.5 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "slate" | "amber" | "teal" | "rose" | "emerald" | "sky" | "indigo";
  children: ReactNode;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    teal: "bg-teal-100 text-teal-800",
    rose: "bg-rose-100 text-rose-800",
    emerald: "bg-emerald-100 text-emerald-800",
    sky: "bg-sky-100 text-sky-800",
    indigo: "bg-indigo-100 text-indigo-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-paper p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const generated = useId();
  const id = children.props.id ?? generated;
  return (
    <div className="block space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900";

export const TONE_STYLES: Record<
  LinkTone,
  { icon: string; hover: string; title: string }
> = {
  teal: {
    icon: "bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white",
    hover: "hover:border-teal-500/50",
    title: "group-hover:text-teal-700",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white",
    hover: "hover:border-sky-500/50",
    title: "group-hover:text-sky-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    hover: "hover:border-emerald-500/50",
    title: "group-hover:text-emerald-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
    hover: "hover:border-amber-500/50",
    title: "group-hover:text-amber-700",
  },
  indigo: {
    icon: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    hover: "hover:border-indigo-500/50",
    title: "group-hover:text-indigo-700",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
    hover: "hover:border-rose-500/50",
    title: "group-hover:text-rose-700",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white",
    hover: "hover:border-slate-400",
    title: "group-hover:text-slate-800",
  },
};

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
