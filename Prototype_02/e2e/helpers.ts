import type { Page } from "@playwright/test";

/** Manager website sign-in (Baker, director@, dining@). Staff emails are refused here. */
export async function signInAs(page: Page, email: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Demo email").fill(email);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Today at a glance" }).waitFor();
}

/** Staff phone app sign-in at /app. Any job can use it. */
export async function signInOnPhone(page: Page, email: string) {
  await page.goto("/app");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Demo email").fill(email);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "What do you need to do?" }).waitFor();
}

export async function checkEveryBox(page: Page) {
  for (const box of await page.getByRole("checkbox").all()) {
    await box.check();
  }
}

/** Local YYYY-MM-DD, `days` from today, matching the app's date keys. */
export function dayKey(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
