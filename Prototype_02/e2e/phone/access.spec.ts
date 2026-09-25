import { expect, test } from "@playwright/test";
import { signInOnPhone } from "../helpers";

test("signing out sends you to sign in", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/app\/signin$/);
});

test("an email that is not on the list cannot sign in", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Sign out" }).click();

  await page.getByLabel("Work email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/signin$/);
});

test("kitchen staff do not see Access", async ({ page }) => {
  await signInOnPhone(page, "kitchen@homestead.demo");

  await expect(page.getByRole("link", { name: /Dining/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Access", exact: true })).toHaveCount(0);
});

test("the phone app has bottom tabs, and only managers get a link to the website", async ({ page }) => {
  await page.goto("/app");
  const tabs = page.getByRole("navigation").last();
  for (const name of ["Home", "Rooms", "Housekeeping", "Dining", "Maintenance"]) {
    await expect(tabs.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await tabs.getByRole("link", { name: "Housekeeping", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/housekeeping$/);
  await expect(page.getByRole("link", { name: "Manager website" })).toBeVisible();

  await signInOnPhone(page, "housekeeping@homestead.demo");
  await expect(page.getByRole("link", { name: "Manager website" })).toHaveCount(0);
});

test("the dining manager can use the phone app too", async ({ page }) => {
  await signInOnPhone(page, "dining@homestead.demo");
  await page.getByRole("link", { name: /^Dining/ }).first().click();
  await expect(page).toHaveURL(/\/app\/dining$/);
  await page.getByRole("link", { name: /^Kitchen queue/ }).click();
  await expect(page).toHaveURL(/\/app\/dining\/kitchen$/);
  await expect(page.getByRole("link", { name: "Back to dining" })).toHaveAttribute("href", "/app/dining");
});
