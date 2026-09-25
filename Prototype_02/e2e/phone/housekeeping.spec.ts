import { expect, test } from "@playwright/test";
import { checkEveryBox, signInOnPhone } from "../helpers";

test("housekeeper works a routine clean with the checklist and timer", async ({ page }) => {
  await signInOnPhone(page, "housekeeping@homestead.demo");
  await page.goto("/app/housekeeping");
  await expect(page.getByRole("heading", { name: "My cleans today" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open room 107" })).toHaveCount(0);

  await page.getByRole("link", { name: "Open room 101" }).click();
  await expect(page.getByText("Target 25 min")).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeDisabled();

  await page.getByRole("button", { name: "Start clean" }).click();
  await expect(page.getByLabel("Timer")).toHaveText(/^0:0\d$/);
  await page.getByRole("checkbox", { name: "Empty trash" }).check();
  await page.getByRole("button", { name: "Finish clean" }).click();
  await expect(page.getByText("4 checklist items left.")).toBeVisible();

  await checkEveryBox(page);
  await page.getByRole("button", { name: "Finish clean" }).click();
  await expect(page.getByText("Room 101 finished.")).toBeVisible();
  await expect(page.getByText("Finished at")).toBeVisible();
});

test("a note during a clean alerts the housekeeping director", async ({ page }) => {
  await signInOnPhone(page, "housekeeping@homestead.demo");
  await page.goto("/app/housekeeping");
  await page.getByRole("link", { name: "Open room 101" }).click();
  await page.getByLabel("Note").fill("Window latch is loose");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Window latch is loose")).toBeVisible();

  await signInOnPhone(page, "director@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Housekeeping note: room 101")).toBeVisible();
});

test("a maintenance request from a clean reaches the maintenance crew", async ({ page }) => {
  await signInOnPhone(page, "housekeeping@homestead.demo");
  await page.goto("/app/housekeeping");
  await page.getByRole("link", { name: "Open room 101" }).click();
  await page.getByRole("button", { name: "Maintenance request" }).click();
  await page.getByLabel("What is wrong").fill("Closet door off track");
  await page.getByRole("button", { name: "Send to maintenance" }).click();
  await expect(page.getByText("Request sent to maintenance.")).toBeVisible();
  await expect(page.getByText("Maintenance request sent: Closet door off track")).toBeVisible();

  await signInOnPhone(page, "maintenance@homestead.demo");
  await page.goto("/app/maintenance");
  await expect(page.getByText("Closet door off track")).toBeVisible();
  await expect(page.getByText(/Room 101 · .* · from a clean/)).toBeVisible();
});

test("director assigns a deep clean and the housekeeper is alerted", async ({ page }) => {
  await signInOnPhone(page, "director@homestead.demo");
  await page.goto("/app/housekeeping");
  await expect(page.getByText("1 unassigned")).toBeVisible();
  await page.goto("/app/housekeeping/assign");
  await page.getByLabel("Deep clean for room 104").selectOption({ label: "housekeeping2" });

  await signInOnPhone(page, "housekeeping2@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Deep clean assigned: room 104")).toBeVisible();
  await page.goto("/app/housekeeping");
  await expect(page.getByRole("link", { name: "Open room 104" })).toBeVisible();
});

test("director changes a room's owner and repeat days", async ({ page }) => {
  await signInOnPhone(page, "director@homestead.demo");
  await page.goto("/app/housekeeping/assign");
  await page.getByLabel("Housekeeper for room 110").selectOption({ label: "housekeeping" });
  const monday = page.getByRole("button", { name: "Room 110 Mon" });
  const before = await monday.getAttribute("aria-pressed");
  await monday.click();
  await expect(monday).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
  await expect(page.getByText("Time compliance (last 7 days)")).toBeVisible();
});

test("housekeeper does not see Rooms or assignments", async ({ page }) => {
  await signInOnPhone(page, "housekeeping@homestead.demo");
  await expect(page.getByRole("link", { name: "Rooms", exact: true })).toHaveCount(0);
  await page.goto("/app/housekeeping/assign");
  await expect(page.getByText("You do not have access")).toBeVisible();
});
