import { expect, test } from "@playwright/test";
import { signInAs, signInOnPhone } from "./helpers";

test("Weekly pulse shows bottlenecks and where the time goes", async ({ page }) => {
  await page.goto("/pulse");
  await expect(page.getByRole("heading", { name: "Weekly pulse" })).toBeVisible();

  const repairs = page.getByRole("button", { name: /^Repair requests/ });
  await expect(repairs.getByText("Bottleneck")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Room cleans/ }).getByText("On track")).toBeVisible();

  const repairDetail = page.getByRole("region", { name: "Where the time goes: Repair requests" });
  await expect(repairDetail.getByText("Seen → assigned")).toBeVisible();
  await expect(repairDetail.getByText(/before anyone is assigned/)).toBeVisible();

  await page.getByRole("button", { name: /^Move-out deep cleans/ }).click();
  const deep = page.getByRole("region", { name: "Where the time goes: Move-out deep cleans" });
  await expect(deep.getByText("Move-out → started")).toBeVisible();
  await expect(deep.getByText("Try this")).toBeVisible();
});

test("Weekly pulse shows what residents are telling us, by week or month", async ({ page }) => {
  await page.goto("/pulse");
  await expect(page.getByText(/\d+ concerns · \d+ compliments this week/)).toBeVisible();
  await expect(page.getByText("Food temperature")).toBeVisible();
  await expect(page.getByText(/Lunch was cold again/)).toBeVisible();

  await page.getByRole("button", { name: "This month" }).click();
  await expect(page.getByRole("button", { name: "This month" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/\d+ concerns · \d+ compliments this month/)).toBeVisible();

  await page.getByRole("link", { name: "See rooms that need a visit" }).click();
  await expect(page).toHaveURL(/\/residents$/);
});

test("pulse only shows processes the job can see, and kitchen staff can't open it", async ({ page }) => {
  await signInAs(page, "director@homestead.demo");
  await page.goto("/pulse");
  await expect(page.getByRole("button", { name: /^Move-out deep cleans/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^To-go trays/ })).toHaveCount(0);

  await signInAs(page, "dining@homestead.demo");
  await page.goto("/pulse");
  await expect(page.getByRole("button", { name: /^To-go trays/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Move-out deep cleans/ })).toHaveCount(0);

  await signInOnPhone(page, "kitchen@homestead.demo");
  await page.goto("/pulse");
  await expect(page.getByRole("heading", { name: "This website is for managers" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Repair requests/ })).toHaveCount(0);
});
