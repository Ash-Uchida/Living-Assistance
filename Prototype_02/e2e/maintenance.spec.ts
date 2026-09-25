import { expect, test } from "@playwright/test";
import { signInOnPhone } from "./helpers";

test("assigning a repair alerts that crew member and clears it from Today", async ({ page }) => {
  await page.goto("/");
  const panel = page.getByRole("region", { name: "Problems to solve" });
  await panel
    .getByRole("listitem")
    .filter({ hasText: "Leaking sink, Room 101" })
    .getByRole("link", { name: "Assign" })
    .click();
  await expect(page).toHaveURL(/\/maintenance#m-1$/);
  await page.getByLabel("Assign Leaking sink").selectOption({ label: "maintenance2" });
  await expect(page.getByText("Assigned to maintenance2")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Leaking sink, Room 101")).toHaveCount(0);

  await signInOnPhone(page, "maintenance2@homestead.demo");
  await page.goto("/app/inbox");
  await expect(page.getByText("Repair assigned: Leaking sink")).toBeVisible();
});
