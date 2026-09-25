import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test("signing out sends you to sign in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/signin$/);
});

test("an email that is not on the list cannot sign in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();

  await page.getByLabel("Work email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/signin$/);
});

test("kitchen staff do not see Access", async ({ page }) => {
  await signInAs(page, "kitchen@homestead.demo");

  await expect(page.getByRole("link", { name: /Dining/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Access", exact: true })).toHaveCount(0);
});
