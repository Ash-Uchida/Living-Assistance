"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { jobLabel } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

export default function PhoneSignInPage() {
  const store = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.signIn(email);
    if (result) {
      setError(result);
      return;
    }
    router.replace("/app");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
          Homestead Assisted Living
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="text-sm text-slate-600">
          Use the work email on the access list. That job decides what you can
          open.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-paper p-5 shadow-sm"
      >
        <Field label="Work email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="baker@homestead.demo"
            className={inputClass}
            required
            autoComplete="username"
          />
        </Field>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full">
          Sign in
        </PrimaryButton>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Demo emails
        </p>
        <ul className="space-y-2">
          {store.employees
            .filter((person) => person.role)
            .map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(person.email);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-paper px-4 py-3 text-left text-sm hover:border-teal-400"
                >
                  <span className="block font-medium text-slate-900">
                    {person.email}
                  </span>
                  <span className="text-xs text-slate-500">
                    {jobLabel(person.role)}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
