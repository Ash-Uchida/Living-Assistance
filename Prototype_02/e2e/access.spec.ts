import { expect, test } from "@playwright/test";
import { signInAs, signInOnPhone } from "./helpers";

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

test("Baker sees every department, the insights and Access in the sidebar", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.getByRole("complementary");
  for (const name of ["Today", "Rooms", "Housekeeping", "Dining", "Maintenance", "Activities", "Weekly pulse", "Calendar", "Residents", "Access"]) {
    await expect(sidebar.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(sidebar.getByText("baker@homestead.demo")).toBeVisible();
  await expect(sidebar.getByText("Operations manager")).toBeVisible();
});

test("there is no Manager / Staff view switch", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^(Manager|Staff)$/ })).toHaveCount(0);
  await expect(page.getByText(/Viewing as/i)).toHaveCount(0);
});

test("on a phone, Today uses a bottom nav and a menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
  const bottom = page.getByRole("navigation");
  for (const name of ["Today", "Pulse", "Calendar", "Residents"]) {
    await expect(bottom.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("button", { name: "Sign out" })).toBeVisible();
  await menu.getByRole("link", { name: /^Access/ }).click();
  await expect(page).toHaveURL(/\/access$/);
});

test("the dining manager signs in to the website but does not see Access", async ({ page }) => {
  await signInAs(page, "dining@homestead.demo");
  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByRole("link", { name: /^Dining/ })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: /^Weekly pulse/ })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: /^Access/ })).toHaveCount(0);
});

test("staff cannot sign in to the manager website", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Work email").fill("kitchen@homestead.demo");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("This website is for managers. Staff sign in on the phone app.")).toBeVisible();
  await expect(page).toHaveURL(/\/signin$/);

  await page.getByRole("link", { name: "Use the phone app" }).click();
  await expect(page).toHaveURL(/\/app\/signin$/);
});

test("staff signed in on the phone are sent back to it from the website", async ({ page }) => {
  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "This website is for managers" })).toBeVisible();
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await page.getByRole("link", { name: "Open the phone app" }).click();
  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
});

test("a manager can switch between the website and the phone app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("complementary").getByRole("link", { name: "Staff phone app" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
  await page.getByRole("link", { name: "Manager website" }).click();
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
});
