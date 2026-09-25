import { expect, test } from "@playwright/test";
import { signInAs, signInOnPhone } from "./helpers";

test("an order sent from the phone app shows in the kitchen queue on the website", async ({ page }) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/dining/order");
  await page.getByLabel("Room").selectOption("110");
  await page.getByLabel("Choice").selectOption({ label: "Special order (off the menu)" });
  await page.getByLabel("Special order").fill("Warm oatmeal, no raisins");
  await page.getByRole("button", { name: "Send to kitchen" }).click();
  await expect(page.getByText("Order sent for room 110.")).toBeVisible();

  await signInAs(page, "dining@homestead.demo");
  await page.goto("/dining/kitchen");
  await expect(page.getByText("“Warm oatmeal, no raisins”")).toBeVisible();
});

test("an event added on the website shows on the phone calendar", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "+ Add to calendar" }).click();
  await page.getByLabel("What is happening").fill("Garden walk");
  await page.getByLabel("Building").selectOption("Building C");
  await page.getByRole("button", { name: /^Add to / }).click();

  await page.goto("/app/calendar");
  const walk = page.getByRole("listitem").filter({ hasText: "Garden walk" });
  await expect(walk.getByText(/Building C/)).toBeVisible();
});
