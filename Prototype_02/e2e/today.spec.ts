import { expect, test } from "@playwright/test";
import { signInAs, signInOnPhone } from "./helpers";

const problems = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Problems to solve" });

test("Today lists the most urgent problems first, then the rest", async ({ page }) => {
  await page.goto("/");
  const panel = problems(page);
  await expect(panel.getByText("Leaking sink, Room 101")).toBeVisible();
  await expect(panel.getByText(/Room 107 is \d+ min over time/)).toBeVisible();
  await expect(panel.getByText("To-go tray waiting, Room 107")).toBeVisible();
  await expect(panel.getByText("Deep clean, Room 104")).toHaveCount(0);

  await panel.getByRole("button", { name: /^Show all \d+$/ }).click();
  await expect(panel.getByText("Deep clean, Room 104")).toBeVisible();
  await expect(panel.getByText("Breakfast menu missing")).toBeVisible();

  await panel
    .getByRole("listitem")
    .filter({ hasText: "Deep clean, Room 104" })
    .getByRole("link", { name: "Assign" })
    .click();
  await expect(page).toHaveURL(/\/housekeeping\/assign$/);
});

test("Alert station re-sends the tray alert to the nurse station", async ({ page }) => {
  await page.goto("/");
  const tray = problems(page).getByRole("listitem").filter({ hasText: "To-go tray waiting, Room 107" });
  await tray.getByRole("button", { name: "Alert station" }).click();
  await expect(tray.getByRole("button", { name: "Alert sent" })).toBeDisabled();

  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Still waiting: room 107")).toBeVisible();
});

test("a manager sends a notice to a job", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Send a notice" }).click();
  await page.getByRole("button", { name: "Send notice" }).click();
  await expect(page.getByText("Give the notice a title.")).toBeVisible();
  await page.getByLabel("Notice title").fill("Fire drill at 2");
  await page.getByLabel("Message").fill("Meet in the courtyard");
  await page.getByRole("button", { name: "Send notice" }).click();
  await expect(page.getByText("Pick at least one job to send it to.")).toBeVisible();
  await page.getByLabel("Kitchen", { exact: true }).check();
  await page.getByRole("button", { name: "Send notice" }).click();
  await expect(page.getByText("Notice sent to 1 job.")).toBeVisible();

  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Fire drill at 2")).toBeVisible();

  await signInOnPhone(page, "housekeeping@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Fire drill at 2")).toHaveCount(0);
});

test("the housekeeping director only sees problems their job can act on", async ({ page }) => {
  await signInAs(page, "director@homestead.demo");
  const panel = problems(page);
  await expect(panel.getByText("Leaking sink, Room 101")).toBeVisible();
  await expect(panel.getByText(/Room 107 is \d+ min over time/)).toBeVisible();
  await panel.getByRole("button", { name: /^Show all \d+$/ }).click();
  await expect(panel.getByText("Deep clean, Room 104")).toBeVisible();
  await expect(panel.getByText("To-go tray waiting, Room 107")).toHaveCount(0);
  await expect(panel.getByText("Breakfast menu missing")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send a notice" })).toBeVisible();
});

test("Today has a card per department with live counts", async ({ page }) => {
  await page.goto("/");
  const departments = page.getByRole("region", { name: "Departments" });
  await expect(departments.getByRole("link", { name: /Rooms.*4 checked in/ })).toBeVisible();
  await expect(departments.getByRole("link", { name: /Maintenance.*open requests/ })).toBeVisible();
  await expect(departments.getByRole("link", { name: /Dining.*to-go tray/ })).toBeVisible();
  await expect(departments.getByRole("link", { name: /Activities.*today/ })).toBeVisible();
});
