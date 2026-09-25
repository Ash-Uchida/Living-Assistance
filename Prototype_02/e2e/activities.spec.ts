import { expect, test } from "@playwright/test";
import { dayKey, signInAs } from "./helpers";

test("a manager adds an activity with a building and takes attendance on the week calendar", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "+ Add to calendar" }).click();

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

test("a lead without attendance can see it but not change it", async ({ page }) => {
  await signInAs(page, "dining@homestead.demo");
  await page.goto("/calendar");
  const bingo = page.getByRole("listitem").filter({ hasText: "Bingo" });
  await expect(bingo.getByText(/Building A/)).toBeVisible();
  await bingo.getByRole("button", { name: "Attendance 2" }).click();
  await expect(bingo.getByRole("button", { name: "Bingo room 101" })).toBeDisabled();
});

test("week calendar warns about a short-staffed busy day, and fixing staffing clears it", async ({
  page,
}) => {
  await page.goto(`/calendar?day=${dayKey(1)}`);
  const risks = page.locator("div").filter({ has: page.getByRole("heading", { name: /what could go wrong/ }) }).last();
  await expect(risks.getByText(/Birthday lunch at .* brings a bigger crowd .* dining is 1 short/)).toBeVisible();
  await expect(page.getByText("5 of 6 scheduled · short 1")).toBeVisible();

  await page.getByRole("button", { name: "More dining staff" }).click();
  await expect(page.getByText("6 of 6 scheduled")).toBeVisible();
  await expect(risks.getByText("Nothing flagged for this day.")).toBeVisible();
});

test("department filters hide other departments", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("listitem").filter({ hasText: "Routine cleans" })).toBeVisible();
  await page.getByRole("button", { name: "Housekeeping", exact: true }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Routine cleans" })).toHaveCount(0);
  await expect(page.getByRole("listitem").filter({ hasText: "Bingo" })).toBeVisible();

  await page.goto("/calendar?dept=activities");
  await expect(page.getByRole("button", { name: "Dining", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("listitem").filter({ hasText: "Bingo" })).toBeVisible();
});
