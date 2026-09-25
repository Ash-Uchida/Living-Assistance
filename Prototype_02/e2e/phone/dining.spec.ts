import { expect, test } from "@playwright/test";
import { TINY_PNG, signInOnPhone } from "../helpers";

test("special to-go order goes to the kitchen and the ready alert reaches the station", async ({
  page,
}) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/dining/order");
  await page.getByLabel("Room").selectOption("107");
  await page.getByLabel("Choice").selectOption({ label: "Special order (off the menu)" });
  await page.getByLabel("Special order").fill("Soft scrambled eggs, toast on the side");
  await page.getByText("To-go tray", { exact: true }).click();
  await page.getByRole("button", { name: "Send to kitchen" }).click();
  await expect(page.getByText("Order sent for room 107.")).toBeVisible();

  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/app/dining/kitchen");
  const special = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Special orders/ }) });
  const card = special.getByText("“Soft scrambled eggs, toast on the side”").locator("xpath=../..");
  await expect(card.getByText("To-go tray")).toBeVisible();
  await card.getByRole("button", { name: "Ready — alert staff" }).click();
  await expect(page.getByText(/Room 107 · Special order · To-go tray/)).toBeVisible();

  await signInOnPhone(page, "station@homestead.demo");
  await expect(page.getByRole("link", { name: /Alerts, [1-9]/ })).toBeVisible();
  await page.goto("/app/inbox");
  await expect(page.getByText("Order ready: room 107")).toBeVisible();
  await page.getByText("Order ready: room 107").click();
  await expect(page).toHaveURL(/\/app\/dining\/order$/);
  const readyRow = page.getByRole("listitem").filter({ hasText: "Room 107 · Special order" });
  await readyRow.getByRole("button", { name: "Picked up" }).click();
  await expect(readyRow).toHaveCount(0);
});

test("kitchen marks a regular order complete", async ({ page }) => {
  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/app/dining/kitchen");
  const incoming = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /^Incoming/ }) });
  await incoming.getByRole("button", { name: "Ready — alert staff" }).first().click();
  const readySection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /^Ready, waiting/ }) });
  const waiting = readySection.getByRole("listitem").filter({ hasText: "Room 107 · Turkey sandwich" });
  await waiting.getByRole("button", { name: "Complete" }).click();
  await expect(waiting).toHaveCount(0);
  const done = page.locator("section").filter({ has: page.getByRole("heading", { name: "Complete" }) });
  await expect(done.getByText(/Room 107 · Turkey sandwich/)).toBeVisible();
});

test("menus: upload a file and add a dish by meal type", async ({ page }) => {
  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/app/dining/menus");
  await page.getByRole("button", { name: /^Dinner/ }).click();
  await page.getByLabel("Upload menu file").setInputFiles(TINY_PNG);
  await expect(page.getByText("Dinner menu uploaded.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Dinner menu" })).toBeVisible();

  await page.getByLabel("New dish").fill("Beef chili");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Beef chili")).toBeVisible();

  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/dining/order");
  await page.getByLabel("Meal").selectOption("dinner");
  await expect(page.getByRole("link", { name: "View dinner menu" })).toBeVisible();
  await page.getByLabel("Choice").selectOption({ label: "Beef chili" });
});

test("nurse station cannot open the kitchen queue or menus", async ({ page }) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/dining/kitchen");
  await expect(page.getByText("You do not have access")).toBeVisible();
  await page.goto("/app/dining/menus");
  await expect(page.getByText("You do not have access")).toBeVisible();
});
