import { expect, test } from "@playwright/test";
import { TINY_PNG, signInOnPhone } from "../helpers";

test("staff send a request with a photo and crew moves it to complete", async ({ page }) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/maintenance");
  await page.getByLabel("What is wrong").fill("Lobby door sticks");
  await page.getByLabel("Area").fill("Main lobby");
  await page.getByLabel("Priority").selectOption("urgent");
  await page.getByLabel("Photos (up to 3)").setInputFiles(TINY_PNG);
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
  await page.getByRole("button", { name: "Send to maintenance" }).click();
  await expect(page.getByText("Request sent to maintenance.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Lobby door sticks photo 1" })).toBeVisible();

  await signInOnPhone(page, "maintenance@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Urgent request: Lobby door sticks")).toBeVisible();
  await page.goto("/app/maintenance");
  await page.getByLabel("Status for Lobby door sticks").selectOption("in_progress");
  await page.getByRole("button", { name: "Update" }).first().click();
  await page.getByLabel("Status for Lobby door sticks").selectOption("done");
  await page.getByLabel("Update note for Lobby door sticks").fill("Planed the edge");
  await page.getByRole("button", { name: "Update" }).first().click();
  await expect(page.getByText("Lobby door sticks")).toHaveCount(0);
  await page.getByRole("button", { name: /^Complete \d+$/ }).click();
  await expect(page.getByText(/Complete — Planed the edge/)).toBeVisible();

  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Request update: Lobby door sticks").first()).toBeVisible();
});

test("a request needs a room or an area", async ({ page }) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/maintenance");
  await page.getByLabel("What is wrong").fill("Something rattles");
  await page.getByRole("button", { name: "Send to maintenance" }).click();
  await expect(page.getByText("Pick a room or name the area.")).toBeVisible();
});

test("only the crew can change status", async ({ page }) => {
  await signInOnPhone(page, "station@homestead.demo");
  await page.goto("/app/maintenance");
  await page.getByRole("button", { name: /^Open \d+$/ }).click();
  await expect(page.getByText("Hallway light out")).toBeVisible();
  await expect(page.getByLabel("Status for Hallway light out")).toHaveCount(0);
});
