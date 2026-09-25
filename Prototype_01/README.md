# Homestead operations demo

Clickable Module 2 prototype for Homestead Assisted Living: housekeeping and dining. Room numbers and station labels only. No resident names.

> This standalone copy is superseded. The same experience now lives as the staff phone app at `/app` inside `Prototype_02/`, sharing data with the manager website. Keep this folder only for reference.

See `/ROADMAP.md` in the repo root.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with a demo work email (try `baker@homestead.demo`).

## End-to-end tests

[Playwright](https://playwright.dev/) tests live in `e2e/`. Each test starts from fresh fake data. If the dev server is already running on port 3000 the tests use it; otherwise they start one.

```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # run headless
npm run test:e2e:ui               # watch tests click through the app
npx playwright show-report        # open the last HTML report
```
