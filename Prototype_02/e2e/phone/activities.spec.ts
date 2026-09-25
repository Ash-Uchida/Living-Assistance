import { expect, test } from "@playwright/test";
import { signInOnPhone } from "../helpers";

test("activities adds an activity with a building and takes attendance", async ({ page }) => {
  await signInOnPhone(page, "activities@homestead.demo");
  await page.goto("/app/calendar");
  await expect(page.getByRole("heading", { name: "Activities" })).toBeVisible();

  await page.getByLabel("What is happening").fill("Tai chi");
  await page.getByLabel("Building").selectOption("Building B");
  await page.getByRole("button", { name: /^Add to / }).click();

  const event = page.getByRole("listitem").filter({ hasText: "Tai chi" });
  await expect(event.getByText(/Building B/)).toBeVisible();
  await event.getByRole("button", { name: "Attendance 0" }).click();
  await event.getByRole("button", { name: "Tai chi room 101" }).click();
  await event.getByRole("button", { name: "Tai chi room 107" }).click();
  await expect(event.getByRole("button", { name: "Attendance 2" })).toBeVisible();
  await expect(event.getByRole("button", { name: "Tai chi room 101" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("other jobs can see attendance but not change it", async ({ page }) => {
  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/app/calendar");
  const bingo = page.getByRole("listitem").filter({ hasText: "Bingo" });
  await expect(bingo.getByText(/Building A/)).toBeVisible();
  await bingo.getByRole("button", { name: "Attendance 2" }).click();
  await expect(bingo.getByRole("button", { name: "Bingo room 101" })).toBeDisabled();
});
