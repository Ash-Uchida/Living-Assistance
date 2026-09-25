import { expect, test } from "@playwright/test";
import { checkEveryBox, signInAs } from "./helpers";

test("home shows the rooms checked-in count", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Rooms.*4 checked in/ })).toBeVisible();
});

test("check out sends a deep clean that must be assigned and finished before the room opens", async ({
  page,
}) => {
  await page.goto("/rooms");
  await page.getByLabel("Check in a room").selectOption("103");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText("Room 103 is occupied")).toBeVisible();

  const row = page.getByRole("listitem").filter({
    has: page.getByRole("button", { name: "103", exact: true }),
  });
  await row.getByRole("button", { name: "Check out" }).click();
  await expect(page.getByText("Room 103 checked out. Deep clean sent to housekeeping.")).toBeVisible();
  await expect(row.getByText("Needs deep clean")).toBeVisible();

  await page.goto("/housekeeping/assign");
  await page.getByLabel("Deep clean for room 103").selectOption({ label: "housekeeping" });

  await signInAs(page, "housekeeping@homestead.demo");
  await expect(page.getByRole("link", { name: "Alerts, 1 unread" })).toBeVisible();
  await page.goto("/housekeeping");
  await page.getByRole("link", { name: "Open room 103" }).click();
  await page.getByRole("button", { name: "Start clean" }).click();
  await checkEveryBox(page);
  await page.getByRole("button", { name: "Finish clean" }).click();
  await expect(page.getByText("Room 103 finished.")).toBeVisible();

  await signInAs(page, "baker@homestead.demo");
  await page.goto("/rooms");
  await expect(
    page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "103", exact: true }) })
      .getByText("Vacant"),
  ).toBeVisible();
});

test("clicking a room shows its stay history", async ({ page }) => {
  await page.goto("/rooms");
  await page.getByRole("button", { name: "101", exact: true }).click();
  await expect(page.getByText("History for room 101")).toBeVisible();
});

test("stay history page filters by room", async ({ page }) => {
  await page.goto("/rooms/history");
  await expect(page.getByRole("heading", { name: "Stay history" })).toBeVisible();
  await page.getByLabel("Room").selectOption("101");
  await expect(page.getByText("2 stays")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(2);
});
