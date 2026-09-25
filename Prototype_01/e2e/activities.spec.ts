import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test("activities adds an activity with a building and takes attendance", async ({ page }) => {
  await signInAs(page, "activities@homestead.demo");
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "Activities" })).toBeVisible();

  await page.getByLabel("What is happening").fill("Chair yoga");
  await page.getByLabel("Building").selectOption("North building");
  await page.getByRole("button", { name: /^Add to / }).click();

  const event = page.getByRole("listitem").filter({ hasText: "Chair yoga" });
  await expect(event.getByText(/North building/)).toBeVisible();
  await event.getByRole("button", { name: "Attendance 0" }).click();
  await event.getByRole("button", { name: "Chair yoga room 101" }).click();
  await event.getByRole("button", { name: "Chair yoga room 107" }).click();
  await expect(event.getByRole("button", { name: "Attendance 2" })).toBeVisible();
  await expect(event.getByRole("button", { name: "Chair yoga room 101" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("other jobs can see attendance but not change it", async ({ page }) => {
  await signInAs(page, "kitchen@homestead.demo");
  await page.goto("/calendar");
  const bingo = page.getByRole("listitem").filter({ hasText: "Bingo" });
  await expect(bingo.getByText(/Main building/)).toBeVisible();
  await bingo.getByRole("button", { name: "Attendance 2" }).click();
  await expect(bingo.getByRole("button", { name: "Bingo room 101" })).toBeDisabled();
});
