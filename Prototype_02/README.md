# Homestead operations — manager website and staff phone app

One app, two surfaces, same demo data (room numbers only, email sign-in, the job decides access, every department screen from the client doc).

**Manager website at `/`**, for the operations manager and department leads (housekeeping director, dining manager). Layout from the design screenshots in `reference/`:

- **Today**: department cards plus "Problems to solve", worked out from live data and limited to what your job can act on. Managers can send a notice to chosen jobs.
- **Weekly pulse**: where work gets stuck against targets, a stage-by-stage breakdown with a tip, and what residents are telling us.
- **Calendar**: week view across Housekeeping, Dining, Maintenance and Activities, with what could go wrong, staffing counts and feedback for the day. Attendance by room is still here.
- **Residents**: a lens by room number (no names) showing which rooms need a visit and why, a week timeline across departments, and forms to log feedback and plan a visit.

Staff emails (housekeepers, kitchen, nurse station, maintenance, activities) cannot sign in to the website; they are pointed to the phone app.

**Staff phone app at `/app`**, for every job (the Prototype 1 experience): department home, bottom tabs, month Activities calendar, and the same Rooms, Housekeeping, Dining, Maintenance and Access screens. Managers can use it too, and get a "Manager website" link. It can be added to a phone home screen (`app/manifest.ts`).

See `/ROADMAP.md` in the repo root.

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) for the website and [http://localhost:3001/app](http://localhost:3001/app) for the phone app (use a phone-size window). Sign in with a demo work email (try `baker@homestead.demo`).

## Code layout

- `app/(web)/`: website pages, wrapped in `components/app-shell.tsx` (sidebar).
- `app/app/`: phone app, wrapped in `components/phone-shell.tsx`. Its home, sign-in and calendar are its own; the department pages re-export the website's so there is one copy of each screen. Shared pages use `useBase()` from `lib/surface.ts` so their links stay inside the surface you are on.

## End-to-end tests

[Playwright](https://playwright.dev/) tests live in `e2e/`. Each test starts from fresh fake data. If the dev server is already running on port 3001 the tests use it; otherwise they start one.

- `e2e/*.spec.ts` run in the `website` project (desktop browser).
- `e2e/phone/*.spec.ts` run in the `phone` project (Pixel 7 size).

```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # run headless
npm run test:e2e:ui               # watch tests click through the app
npx playwright show-report        # open the last HTML report
```
