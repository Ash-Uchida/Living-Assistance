import type { Page } from "@playwright/test";

export async function signInAs(page: Page, email: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "What do you need to do?" }).waitFor();
}

export async function checkEveryBox(page: Page) {
  for (const box of await page.getByRole("checkbox").all()) {
    await box.check();
  }
}

/** A 1×1 PNG so upload tests don't need a fixture file. */
export const TINY_PNG = {
  name: "photo.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
};
