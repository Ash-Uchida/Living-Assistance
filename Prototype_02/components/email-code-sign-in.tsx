"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { canUseWebsite } from "@/lib/surface";
import { createClient } from "@/lib/supabase/client";
import { staffRoleFor } from "@/lib/supabase/staff";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";

/** Supabase lets each project pick an email code length from 6 to 10 digits (Sign In / Providers → Email). */
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;

function sendError(error: AuthError) {
  if (error.status === 429) return "Too many codes were requested. Wait a few minutes and try again.";
  return error.message || "The code could not be sent. Try again.";
}

/** Real sign-in: Supabase emails a numeric code; the job comes from the staff list in the database. */
export function EmailCodeSignIn({ surface }: { surface: "website" | "phone" }) {
  const store = useStore();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(sendError(error));
      return;
    }
    setCode("");
    setStep("code");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const address = normalizeEmail(email);
    const { error } = await supabase.auth.verifyOtp({ email: address, token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setError("That code is wrong or has expired. Check the latest email or send a new code.");
      return;
    }
    let role = null;
    try {
      role = await staffRoleFor(supabase, address);
    } catch {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Signed in, but your job could not be loaded. Try again.");
      return;
    }
    if (!role) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Your email has no job yet. Ask your operations manager to add you to one.");
      return;
    }
    store.signInWithVerifiedEmail(address, role);
    router.replace(surface === "website" && canUseWebsite(role) ? "/" : "/app");
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className="space-y-4 rounded-2xl border border-slate-200/80 bg-paper p-5 shadow-sm">
        <p className="text-sm text-slate-700">
          We emailed a code to <span className="font-semibold">{normalizeEmail(email)}</span>. It works for about an
          hour.
        </p>
        <Field label="Code from the email">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, MAX_CODE_LENGTH))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`[0-9]{${MIN_CODE_LENGTH},${MAX_CODE_LENGTH}}`}
            placeholder="123456"
            className={`${inputClass} tracking-[0.4em]`}
            required
          />
        </Field>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy || code.length < MIN_CODE_LENGTH}>
            Verify and sign in
          </PrimaryButton>
          <GhostButton
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
          >
            Use a different email
          </GhostButton>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4 rounded-2xl border border-slate-200/80 bg-paper p-5 shadow-sm">
      <Field label="Work email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbuilding.com"
          className={inputClass}
          required
          autoComplete="email"
        />
      </Field>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <PrimaryButton type="submit" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Email me a code"}
      </PrimaryButton>
    </form>
  );
}
