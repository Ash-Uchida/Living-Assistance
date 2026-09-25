import { expect, test } from "@playwright/test";
import { mockSupabaseAuth, openRealSignIn, signInWithCode, supabaseConfigured } from "../supabase-mock";

test.skip(!supabaseConfigured, "Real sign-in needs Supabase settings in .env.local");

test("staff sign in on the phone with an emailed code and get their own tabs", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "kitchen" });
  await openRealSignIn(page, "/app");

  await signInWithCode(page, "cook@example.com");

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Dining/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Access", exact: true })).toHaveCount(0);
});

test("managers who sign in on the phone stay in the phone app", async ({ page }) => {
  await mockSupabaseAuth(page, { role: "ops_manager" });
  await openRealSignIn(page, "/app");

  await signInWithCode(page, "ash@example.com");

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: "Manager website" })).toBeVisible();
});

test("the phone can go back and use a different email", async ({ page }) => {
  const calls = await mockSupabaseAuth(page, { role: "kitchen" });
  await openRealSignIn(page, "/app");

  await page.getByLabel("Work email").fill("typo@example.com");
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByRole("button", { name: "Use a different email" }).click();
  await signInWithCode(page, "cook@example.com");

  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
  expect(calls.otp).toEqual(["typo@example.com", "cook@example.com"]);
});
