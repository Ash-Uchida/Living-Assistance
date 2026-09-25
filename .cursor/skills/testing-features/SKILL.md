---
name: testing-features
description: Writes Playwright end-to-end tests for new or changed features in the Homestead operations prototypes (Prototype_01/ and Prototype_02/), then runs that prototype's full test suite so new work is checked against all earlier tests. Use after building or changing a feature, page, or flow in either prototype, or when the user asks to test, add tests, run tests, run Playwright, or check nothing broke.
---

# Testing features (Homestead prototypes)

There are two separate apps (Next.js, demo data in `localStorage`). Work out which one changed and test **that** folder; if shared rules changed in both, test both.

| Folder | Look | Port | Tests |
| --- | --- | --- | --- |
| `Prototype_02/` | Main demo. Manager website at `/` (green sidebar, Today / Weekly pulse / week Calendar / Residents) **and** staff phone app at `/app` (department home, bottom tabs, month calendar). Same data. | 3001 | `Prototype_02/e2e/` (website) and `Prototype_02/e2e/phone/` (phone app) |
| `Prototype_01/` | Old standalone copy of what is now the phone app. Only test it if someone changes it. | 3000 | `Prototype_01/e2e/` |

Below, `<app>` means the folder you are testing. Every change gets a test, and every run is the **whole** suite for that app, never only the new file.

## Workflow

```
- [ ] 1. Understand the change
- [ ] 2. Write or update tests
- [ ] 3. Static checks
- [ ] 4. Run the full Playwright suite
- [ ] 5. Fix and rerun until green
- [ ] 6. Report
```

### 1. Understand the change

Read the changed pages/components and `<app>/lib/seed.ts` for the starting data the tests will see. Decide what a staff member does with the feature and what they should see afterward. Those become the test steps and assertions.

### 2. Write or update tests

- One spec file per area: `rooms.spec.ts`, `access.spec.ts`, `housekeeping.spec.ts`, `dining.spec.ts`, `maintenance.spec.ts`, `activities.spec.ts`. Add to the matching file or create it.
- In `Prototype_02/`, put a test where the person would actually do the work:
  - Staff jobs work in the phone app → `e2e/phone/` (runs at Pixel 7 size in the `phone` Playwright project). Department flows (rooms, housekeeping, dining, maintenance, month calendar) live here.
  - Managers' website work → `e2e/*.spec.ts` (desktop `website` project): `today.spec.ts`, `pulse.spec.ts`, `residents.spec.ts`, `access.spec.ts`, week calendar in `activities.spec.ts`, repair assigning in `maintenance.spec.ts`.
  - Anything that crosses surfaces (done on the phone, seen on the website, or the reverse) → `e2e/shared.spec.ts`.
  - If you change a shared department page in `app/(web)/`, the phone app uses the same page, so run the full suite (both projects run by default).
- For features that send an alert, sign in as the receiver afterward and check `/inbox`.
- Cover the main happy path, plus one guard (for example: a blocked action, a role that should not see it, an empty state).
- If the change alters existing behavior, **update the old test** to match the new intent. Never delete or weaken an old test just to make the suite pass; if the old behavior was intentionally removed, say so in the report.
- Locators: `getByRole`, `getByLabel`, `getByText`. Use `exact: true` for short names like room numbers or "Check in". No CSS class selectors. `locator("tbody tr")` is fine for tables.
- Scope actions to a row with `page.getByRole("listitem").filter({ has: ... })` or `filter({ hasText: /^103/ })`.
- No `waitForTimeout`. Rely on `expect(...)` auto-waiting.
- If a control can't be found by role or label, fix the app's accessibility (add a `<label>` or accessible name) rather than working around it in the test.

### Test data facts

- Each test starts in a fresh browser, so it gets seed data with `baker@homestead.demo` (operations manager, sees everything) already signed in.
- To test another job, use `signInAs(page, email)` from `e2e/helpers.ts`. Demo emails are in `seed.ts` (`housekeeping@`, `housekeeping2@`, `director@`, `station@`, `kitchen@`, `dining@`, `maintenance@`, `activities@` `homestead.demo`).
- `e2e/helpers.ts` also has `checkEveryBox(page)` (clean checklists) and `TINY_PNG` for `setInputFiles` photo/menu uploads.
- Check `seed.ts` before picking a room. A check-in test needs a `vacant` room (103, 105, 111, 112). Housekeeping works on **clean jobs** (`cleanJobs`), not rooms: room 101 always has a routine clean today for `housekeeping@`; 104 has an unassigned deep clean; 102 and 109 are already mid-clean.
- Form fields use `Field` in `components/ui.tsx`, so `getByLabel("Room")` etc. match the label text only.
- Prototype 2 only:
  - Two sign-in helpers. `signInAs(page, email)` is the **website** and only works for managers (`baker@`, `director@`, `dining@`); it waits for "Today at a glance". `signInOnPhone(page, email)` is the **phone app** at `/app`, works for every job, and waits for "What do you need to do?". Staff emails on the website get "This website is for managers." Both share one login, so after `signInOnPhone` as staff, opening a website page shows the managers-only screen.
  - Phone app URLs are the website URLs with `/app` in front (`/app/housekeeping`, `/app/inbox`). Pulse and Residents are website only.
  - `dayKey(n)` in its helpers gives a local date key for `/calendar?day=...`.
  - Buildings are `Building A/B/C` (Prototype 1: Main building, North building, Courtyard).
  - The seed also builds 30 days of history (repairs, deep cleans, trays, attendance, room feedback), so Weekly pulse and Residents have data. Stories: room 107 has cold-food complaints, late trays and switched to trays; room 101 has an urgent unassigned leaking sink; room 110 attends less; room 106 moves out today; tomorrow dining is 1 short during a birthday lunch.
  - Today's "Problems to solve" shows the top 3; click "Show all N" to reach the rest.
  - Website desktop nav is in the sidebar (`getByRole("complementary")`); the website at phone width has a bottom `navigation` plus the "Menu" dialog. The phone app has a header (bell "Alerts, N unread", Sign out) and bottom tabs (Home plus the first four departments).
  - If Playwright fails with `EADDRINUSE :::3001`, a dev server is on 3001 but broken (usually a stale `.next` after moving routes). Check `curl localhost:3001`; if it returns 500, stop that server, `rm -rf .next`, and rerun.
- Tests run in parallel with separate browsers, so they cannot affect each other.
- Room numbers only. Never put names or health details in test data.

### 3. Static checks

From `<app>/`:

```bash
npx tsc --noEmit
npm run lint
```

### 4. Run the full Playwright suite

From `<app>/` (reuses that app's dev server — port 3000 or 3001 — if it is running, otherwise starts one):

```bash
npx playwright test --reporter=list
```

Run it **outside the sandbox** (`required_permissions: ["all"]`). The browser cache can disappear between sessions, so every test fails instantly with "Executable doesn't exist". If that happens, install in the same command: `npx playwright install chromium >/dev/null 2>&1; npx playwright test --reporter=list`.

Watch for locators that also match the Next.js dev tools button (name "Open Next.js Dev Tools"); anchor regexes like `/^Open \d+$/`.

Make sure the shell is actually in the app folder (`cd ".../Living Assistance/Prototype_02" && ...`). Running from the repo root produces "No tests found" and a stray `test-results/` folder; delete it if created.

### 5. Fix and rerun

For each failure, read the error and `<app>/test-results/<test>/error-context.md` (page snapshot at failure). Decide which is wrong:

- **The app is broken** (a real regression or bug in the new feature): fix the app.
- **The test is wrong** (bad locator, wrong seed assumption): fix the test.

Rerun the **full** suite after every fix. Stop only when everything passes. If something still fails after 3 attempts, stop and report what is failing and why.

### 6. Report

Tell the user in plain words:

- Which tests were added or changed, and what each checks (one line each).
- The final result, for example "12 passed, 0 failed".
- Any bug the tests caught and how it was fixed.
- Any old test that changed because behavior was intentionally changed.

## Example test

```ts
// Prototype_02/e2e/phone/housekeeping.spec.ts
import { expect, test } from "@playwright/test";
import { checkEveryBox, signInOnPhone } from "../helpers";

test("housekeeper finishes a routine clean", async ({ page }) => {
  await signInOnPhone(page, "housekeeping@homestead.demo");
  await page.goto("/app/housekeeping");
  await page.getByRole("link", { name: "Open room 101" }).click();

  await page.getByRole("button", { name: "Start clean" }).click();
  await checkEveryBox(page);
  await page.getByRole("button", { name: "Finish clean" }).click();
  await expect(page.getByText("Room 101 finished.")).toBeVisible();
});
```
