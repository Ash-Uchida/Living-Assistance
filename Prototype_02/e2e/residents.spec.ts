import { expect, test } from "@playwright/test";
import { signInAs, signInOnPhone } from "./helpers";

test("resident lens flags rooms by number and explains why", async ({ page }) => {
  await page.goto("/residents");
  await expect(page.getByRole("button", { name: /^Needs a visit · \d+$/ })).toHaveAttribute("aria-pressed", "true");
  const card = page.getByRole("link", { name: /^Room 107/ });
  await expect(card.getByText("3 meal complaints")).toBeVisible();
  await expect(card.getByText("Trays waiting")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Room 101/ }).getByText(/Open repair \d+ days?/)).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/residents\/107$/);
  const room = page.getByRole("region", { name: "Room 107" });
  await expect(room.getByRole("heading", { name: "Room 107" })).toBeVisible();
  await expect(room.getByText("3 complaints about cold food")).toBeVisible();
  await expect(room.getByText("Stopped coming to lunch in person")).toBeVisible();
  await expect(room.getByText(/Complaint logged: “Lunch was cold again/)).toBeVisible();

  await page.getByRole("button", { name: "Everyone" }).click();
  await expect(page.getByRole("link", { name: /^Room \d{3}/ })).toHaveCount(4);
});

test("logging a complaint adds it to the timeline and alerts the department lead", async ({ page }) => {
  await page.goto("/residents/107");
  await page.getByRole("button", { name: "Log feedback" }).click();
  await page.getByLabel("Department").selectOption("housekeeping");
  await page.getByLabel("Topic").selectOption("room_cleanliness");
  await page.getByRole("button", { name: "Save feedback" }).click();
  await expect(page.getByText("Write what they said.")).toBeVisible();
  await page.getByLabel("What they said").fill("Sheets were not changed");
  await page.getByRole("button", { name: "Save feedback" }).click();
  await expect(page.getByText("Feedback logged for room 107.")).toBeVisible();
  await expect(page.getByText("Complaint logged: “Sheets were not changed”")).toBeVisible();

  await signInAs(page, "director@homestead.demo");
  await page.goto("/inbox");
  await expect(page.getByText("Complaint from room 107")).toBeVisible();
});

test("planning a visit puts it on Today and the calendar until it is done", async ({ page }) => {
  await page.goto("/residents/110");
  await page.getByRole("button", { name: "Plan a visit" }).click();
  await page.getByLabel("Why you are visiting").fill("Ask about activities");
  await page.getByRole("button", { name: "Save visit" }).click();
  await expect(page.getByText(/Visit to room 110 planned for/)).toBeVisible();

  await page.goto("/calendar");
  await expect(page.getByRole("listitem").filter({ hasText: "Visit · Room 110" })).toBeVisible();

  await page.goto("/");
  const panel = page.getByRole("region", { name: "Problems to solve" });
  await panel.getByRole("button", { name: /^Show all \d+$/ }).click();
  const visit = panel.getByRole("listitem").filter({ hasText: "Visit Room 110" });
  await expect(visit).toBeVisible();
  await visit.getByRole("link", { name: "Open" }).click();

  await page.getByRole("button", { name: "Mark done" }).click();
  await page.goto("/");
  await expect(page.getByText("Visit Room 110")).toHaveCount(0);
});

test("the dining manager can open the resident lens, the housekeeping director and staff cannot", async ({
  page,
}) => {
  await signInAs(page, "dining@homestead.demo");
  await page.goto("/residents/107");
  await expect(page.getByRole("region", { name: "Room 107" })).toBeVisible();

  await signInAs(page, "director@homestead.demo");
  await page.goto("/residents");
  await expect(page.getByText("You do not have access")).toBeVisible();

  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/residents/107");
  await expect(page.getByRole("heading", { name: "This website is for managers" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Room 107" })).toHaveCount(0);
});
