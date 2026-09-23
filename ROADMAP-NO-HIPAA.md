# Care Center Software: Roadmap (HIPAA not applied)

**What this file is:** The same product, built as if HIPAA did not apply — free plans, simple auth, no BAAs.

**What this file is not:** Permission to put real residents on this stack. This center **is** a covered entity. Follow this file for the **bootcamp with fake data**, or to see what the cheap path would look like. Real names wait for [ROADMAP-HIPAA.md](ROADMAP-HIPAA.md).

**Goal:** Replace paper check-in. Residents check themselves in and out. Staff see live room status. Start there, then expand.

**Stack:** Next.js, Tailwind, Neon Free (Postgres), Vercel Hobby. Following the 7-module bootcamp.

**Working rule:** Every time a bootcamp prompt says "Supabase," tell the coding agent: *"We are using Neon (Postgres) instead of Supabase."*

**Monthly vendor cost:** about **$0**.

---

## Database choice: Neon (not Supabase)

**Decision: use Neon.** Swap every Supabase step for Neon as described at the bottom of this file.

Supabase Free **pauses the whole project** after about **7 days of low activity**. You have to restore it from the dashboard. Neon Free sleeps after **5 minutes** idle and **wakes on the next query**. That is why Neon wins for a bootcamp you will not open every day.

Both are Postgres. Tables look the same either way. Supabase would be easier in Module 5 (auth is built in). Stay on Neon so the two roadmaps share one codebase.

**Practical note:** the first request after Neon has been idle can take a moment to wake. Fine for development. A live front desk that needed instant first-click would turn off scale-to-zero on a paid plan (see the HIPAA roadmap).

---

## Before Module 1: Define the product

Paste this brief into Module 1, Step 1.

> A web app for a care center that replaces paper check-in. Residents check themselves in and out by name and room. Staff see live room status (available, occupied, needs cleaning, maintenance). Medical notes stay in the center's existing records — this app does not store them. We start with one facility and design for a second building in town.

### Product decisions

- **Who uses it?**
  - **Residents** check themselves in and out.
  - **Staff** (front desk, nurses or aides, housekeeping, manager) watch room status.
  - Expand later; do not build those extra workflows yet.
- **What this app stores (v1):** Name, room, check-in time, check-out time.
- **What this app does not store:** Medical notes, birthday, diagnoses, meds, or any clinical text. Product choice, not a legal trick.
- **One center or many?** One facility is open now. A second is being built in town. Include `facility_id` on every table from day one.

**If you are actually building this for the real center:** use fake residents only. Switch to [ROADMAP-HIPAA.md](ROADMAP-HIPAA.md) before the first real name is saved.

---

## Module 1: Setup and deploy

- Install tools, create the Next.js app, set up Git and GitHub, deploy to Vercel (Hobby is fine).
- Skeleton pages: **Home**, **Resident check-in / check-out**, **Staff dashboard (room board)**, **Resident/Stay detail**.
- **Milestone:** a live URL with those navigable pages.

## Module 2: Interface with mock data

- Mock rooms (number, status) and mock residents (name only).
- Room grid with color-coded status for staff; click a room for stay details (no notes).
- Resident-facing check-in / check-out form (name, room).
- **Milestone:** residents can fake-check themselves in; staff see a clickable room board.

## Module 3: API layer and validation

- Health check, GET rooms, POST check-in routes.
- Server-side validation (required name, valid room, no check-in to an occupied room).
- Learn environment variables and the browser/server trust boundary.
- **Milestone:** the UI talks to your API, and bad data is rejected.

## Module 4: Real database (Neon Free)

- Tables: `rooms` (number, status, `facility_id`), `guests` (name, `facility_id`), `stays` (guest, room, check-in time, check-out time, `facility_id`). No notes column.
- Full CRUD: check-in creates a stay and marks the room occupied; check-out ends the stay and marks the room "needs cleaning."
- `DATABASE_URL` is a server-only secret. The browser never talks to Neon.
- **Milestone:** fake data survives refreshes and deploys.

## Module 5: Accounts and security

- Two login types: **residents** (check in / out only, never see other residents or the full board) and **staff** (front desk, housekeeping, admin) who see their facility's board.
- `facility_id` on every user so the two buildings never share data.
- Auth can be **Neon Auth**, self-hosted Better Auth, Clerk Hobby, or Auth.js. Pick the one the bootcamp step is closest to; Neon Auth is allowed on this roadmap.
- Test with two staff users and two facilities.
- **Milestone:** residents can only act on their own stay; staff only see their own center.

## Module 6: Payments (defer or adapt)

- The module assumes a paywalled SaaS. Defer, or charge care centers a monthly subscription (paywall the whole product).
- If done, the Stripe webhook writes subscription status to Neon.

## Module 7: AI (optional)

- A shift-handoff summary of today's check-ins, check-outs, and rooms needing cleaning is fine on this roadmap if the data is fake.
- If you ever pointed this at real residents, stop and switch to the HIPAA roadmap — names going to a model are a separate vendor problem.

## After the modules: expansion ideas

Housekeeping task lists, maintenance requests, shift handoff notes, visitor logs, occupancy reports, notifications.

## Suggested checkpoints

1. Live demo with mock data (end of Module 2)
2. Working with a real database (Module 4)
3. Secure multi-user version (Module 5). Fine to show the center — **fake names only** unless you have moved to the HIPAA roadmap.

---

## Neon notes: what changes from the bootcamp

Neon is just Postgres. Supabase also bundles auth, storage, and an auto-generated API.

**Module 4:** No `anon` / `service_role` keys. One `DATABASE_URL`, server-only. Use the Neon SQL Editor. Use `@neondatabase/serverless` or Drizzle; pick one and stay consistent.

**Module 5:** Neon Auth is allowed here. Postgres RLS still works. Also filter in server code (`WHERE facility_id = <signed-in user's facility>`). Do both if you can.

**Module 6:** Stripe webhook updates a Neon table.

**Module 7:** Neon supports `pgvector` if you add embeddings later.

**MCP (optional):** `neonctl init` if you want it. Point it only at a development branch with fake data.

---

## What you give up by staying on this file

- You cannot save a real resident. That is the whole point of [ROADMAP-HIPAA.md](ROADMAP-HIPAA.md).
- Neon Auth and Vercel Hobby are fine for fake data and **not** fine for PHI.
- A live front desk may feel a short wake-up delay after idle time.
