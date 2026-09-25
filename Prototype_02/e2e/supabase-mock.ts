import { existsSync } from "node:fs";
import type { Page, Route } from "@playwright/test";

/** Real sign-in only renders when the app has Supabase settings (Prototype_02/.env.local). */
export const supabaseConfigured = existsSync(".env.local") || !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export const GOOD_CODE = "123456";

type MockOptions = {
  /** The job the staff list returns for the email; null = not on the list or no job. */
  role: string | null;
  /** The code Supabase "emailed". Projects choose 6 to 10 digits. */
  code?: string;
  /** Set to make "Email me a code" fail the way the staff-list hook does. */
  sendError?: { status: number; message: string };
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function fakeSession(email: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: "00000000-0000-4000-8000-000000000abc",
    aud: "authenticated",
    role: "authenticated",
    email,
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const accessToken = [
    base64url({ alg: "HS256", typ: "JWT" }),
    base64url({ sub: user.id, email, role: "authenticated", aud: "authenticated", exp: expiresAt }),
    "signature",
  ].join(".");
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: "fake-refresh-token",
    user,
  };
}

async function reply(route: Route, status: number, body?: unknown) {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  await route.fulfill({
    status,
    headers: { ...CORS, "content-type": "application/json" },
    body: body === undefined ? "" : JSON.stringify(body),
  });
}

/**
 * Stands in for Supabase Auth and the staff list so tests never send real email.
 * Returns the requests the app made, so tests can check what was sent.
 */
export async function mockSupabaseAuth(page: Page, options: MockOptions) {
  const calls = { otp: [] as string[], logout: 0 };
  let email = "";

  await page.route("**/auth/v1/otp*", async (route) => {
    if (route.request().method() === "POST") {
      email = (route.request().postDataJSON() as { email: string }).email;
      calls.otp.push(email);
    }
    if (options.sendError) {
      await reply(route, options.sendError.status, {
        code: options.sendError.status,
        msg: options.sendError.message,
      });
      return;
    }
    await reply(route, 200, {});
  });

  await page.route("**/auth/v1/verify*", async (route) => {
    const body = route.request().method() === "POST" ? (route.request().postDataJSON() as { token?: string }) : {};
    if (route.request().method() === "POST" && body.token !== (options.code ?? GOOD_CODE)) {
      await reply(route, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
      return;
    }
    await reply(route, 200, fakeSession(email));
  });

  await page.route("**/rest/v1/staff_accounts*", async (route) => {
    await reply(route, 200, options.role ? [{ role: options.role }] : []);
  });

  await page.route("**/auth/v1/logout*", async (route) => {
    if (route.request().method() === "POST") calls.logout += 1;
    await reply(route, 204);
  });

  return calls;
}

/** Goes to the real sign-in form on the website ("/") or the phone app ("/app"). */
export async function openRealSignIn(page: Page, home: "/" | "/app") {
  await page.goto(home);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Work email").waitFor();
}

export async function signInWithCode(page: Page, email: string, code = GOOD_CODE) {
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("Code from the email").fill(code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
}
