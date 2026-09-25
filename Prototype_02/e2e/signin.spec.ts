import { expect, test } from "@playwright/test";
import { mockSupabaseAuth, openRealSignIn, signInWithCode, supabaseConfigured } from "./supabase-mock";

test.skip(!supabaseConfigured, "Real sign-in needs Supabase settings in .env.local");

const MANAGER = "ash@example.com";

test("a manager signs in with an emailed code and lands on Today", async ({ page }) => {
  const calls = await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/");

  await signInWithCode(page, "  Ash@Example.com ");

  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
  await expect(page.getByText(MANAGER, { exact: true })).toBeVisible();
  expect(calls.otp).toEqual([MANAGER]);
});

test("longer codes work too, because each Supabase project picks 6 to 10 digits", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "ops_manager", code: "12345678" });
  await openRealSignIn(page, "/");

  await page.getByLabel("Work email").fill(MANAGER);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("Code from the email").fill("12345678901");
  await expect(page.getByLabel("Code from the email")).toHaveValue("1234567890");
  await page.getByLabel("Code from the email").fill("12345678");
  await page.getByRole("button", { name: "Verify and sign in" }).click();

  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
});

test("an email that is not on the staff list gets the staff-list message", async ({ page }) => {
  const message = "This email is not on the staff list. Ask your operations manager to add you.";
  await mockSupabaseAuth(page, { role: null, sendError: { status: 403, message } });
  await openRealSignIn(page, "/");

  await page.getByLabel("Work email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Email me a code" }).click();

  await expect(page.getByText(message)).toBeVisible();
  await expect(page.getByLabel("Code from the email")).toHaveCount(0);
  await expect(page).toHaveURL(/\/signin$/);
});

test("too many code requests shows a wait message", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "ops_manager", sendError: { status: 429, message: "rate limited" } });
  await openRealSignIn(page, "/");

  await page.getByLabel("Work email").fill(MANAGER);
  await page.getByRole("button", { name: "Email me a code" }).click();

  await expect(page.getByText("Too many codes were requested. Wait a few minutes and try again.")).toBeVisible();
});

test("a wrong code does not sign you in", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/");

  await signInWithCode(page, MANAGER, "000000");

  await expect(page.getByText("That code is wrong or has expired.", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/signin$/);
});

test("a verified email with no job is signed back out", async ({ page }) => {
  const calls = await mockSupabaseAuth(page, { role: null });
  await openRealSignIn(page, "/");

  await signInWithCode(page, "new.hire@example.com");

  await expect(page.getByText("Your email has no job yet.", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/signin$/);
  expect(calls.logout).toBe(1);
});

test("staff who sign in on the website are sent to the phone app", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "housekeeper" });
  await openRealSignIn(page, "/");

  await signInWithCode(page, "maria@example.com");

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
});

test("a real sign-in survives a reload, and signing out ends the Supabase session", async ({ page }) => {
  const calls = await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/");
  await signInWithCode(page, MANAGER);
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
  await expect(page.getByText(MANAGER, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await expect.poll(() => calls.logout).toBe(1);
});

test("if the Supabase session is gone, the next visit asks you to sign in again", async ({ page, context }) => {
  await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/");
  await signInWithCode(page, MANAGER);
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();

  await context.clearCookies();
  await page.reload();

  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByLabel("Work email")).toBeVisible();
});

test("a job change on the staff list applies on the next visit", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/");
  await signInWithCode(page, MANAGER);
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();

  await page.unroute("**/rest/v1/staff_accounts*");
  await page.route("**/rest/v1/staff_accounts*", (route) =>
    route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" },
      body: JSON.stringify([{ role: "kitchen" }]),
    }),
  );
  await page.reload();

  await expect(page.getByText(`You are signed in as ${MANAGER} (`, { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toHaveCount(0);
});
