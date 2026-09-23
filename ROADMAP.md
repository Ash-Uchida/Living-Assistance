# Care Center Software: Roadmap

**Goal:** Replace paperwork at a care center. Residents check themselves in and out. Staff see live room status. Start there, then expand.

**Stack:** Next.js, Tailwind, Neon (Postgres), Vercel. Following the 7-module bootcamp.

**Working rule:** Every time a bootcamp prompt says "Supabase," tell the coding agent: *"We are using Neon (Postgres) instead of Supabase."*

---

## Database choice: Neon (not Supabase)

**Decision: use Neon.** Keep following the bootcamp, but swap every Supabase step for Neon as described later in this file.

### Why this comes up

Supabase Free **pauses the whole project** after about **7 days of low database activity**. A paused project stays down until someone opens the dashboard and restores it. That is what you are remembering — and it is still true.

Neon also sleeps when idle, but it is a different kind of sleep:

| | Supabase Free | Neon Free |
|---|---|---|
| What happens when idle | Project **pauses after ~7 days** of low activity | Compute **scales to zero after 5 minutes** |
| How it comes back | **Manual restore** from the dashboard | **Wakes automatically** on the next query (usually a few hundred ms) |
| App while asleep | Broken until you unpause | Works; first request after idle is slightly slower |
| Free project limit | 2 active projects | 100 projects |
| What you get | Postgres + Auth + Storage + auto API | Postgres only (you add auth yourself) |

Neon’s scale-to-zero is the better idle behavior for this project. You can skip a week of coding and the next `npm run dev` still talks to the database. You do not have to remember to unpause anything.

### When Supabase would be the better pick

Choose Supabase instead if you want the bootcamp to be copy-paste easy:

- Module 5 (logins, roles, row-level security) is written for Supabase Auth + RLS.
- You get auth, storage, and an auto-generated API without extra libraries.
- Daily use (or a couple of dashboard visits a week) is enough to avoid the 7-day pause.
- Paid Supabase does not pause at all.

That is a real convenience tradeoff, not a quality one. Both are Postgres. The app’s tables (`rooms`, `guests`, `stays`) look the same either way.

### Why Neon still wins for this roadmap

1. **Idle during the bootcamp.** You will not use the app every day. Neon auto-wakes. Supabase Free can go dark for a week.
2. **You already planned the swap.** The Neon notes below are the Module 4–7 deltas. Switching back to Supabase now would throw that away for auth convenience you do not need until Module 5.
3. **One center now, a second in town.** Put `facility_id` on tables from day one so the new building can be added without a rewrite.
4. **Medical notes mean HIPAA.** Build and demo with **fake data only**. Do not put real names, birthdays, or notes on Free/Launch Neon. A real rollout needs a qualified compliance review and Neon **Scale** + a signed BAA. Neon also says Managed Better Auth and the Data API are **outside** that HIPAA boundary — plan auth with that in mind.

**Practical note:** the first request after Neon has been idle for 5+ minutes can take a moment to wake. That is normal on the Free plan. Paid Launch can disable scale-to-zero if a live front desk ever needs instant first-click.

---

## Before Module 1: Define the product

Paste this brief into Module 1, Step 1. Several later steps say "based on the product I described earlier."

> A web app for a care center that replaces paper. Residents check themselves in and out. Staff (front desk, nurses or aides, housekeeping, manager) see the live status of every room (available, occupied, needs cleaning, maintenance). We start with one facility and design for a second building in town. Later we will expand to other workflows.

### Product decisions

- **Who uses it?** Two audiences from the start:
  - **Residents** check themselves in and out.
  - **Staff** (front desk, nurses or aides, housekeeping, manager) watch room status. They do not need to do the check-in for v1.
  - Expand later; do not build those extra workflows yet.
- **What is stored about a resident?** Name, room, check-in time, check-out time, birthday, and medical notes.
  - Birthday and medical notes are why HIPAA may apply. Keep them in the data model, but **never use real people or real notes** until a qualified person confirms the compliance path (not an AI). See [Neon notes](#neon-notes-what-changes-from-the-bootcamp).
- **One center or many?** One facility is open now. A second is being built in town. Include `facility_id` on every table so the new building can be added later without a rewrite.

**Data warning:** Medical notes are health information. HIPAA likely applies to a real deployment. That limits which Neon/Vercel plans and vendors you can use. Build the bootcamp on **fake data only**.

---

## Module 1: Setup and deploy

- Install tools, create the Next.js app, set up Git and GitHub, deploy to Vercel.
- Skeleton pages: **Home**, **Resident check-in / check-out**, **Staff dashboard (room board)**, **Resident/Stay detail**.
- **Milestone:** a live URL with those navigable pages.

## Module 2: Interface with mock data

- Mock rooms (number, status) and mock residents (name, birthday, notes — all fake).
- Room grid with color-coded status for staff; click a room for details.
- Resident-facing check-in / check-out form (name, room, birthday).
- **Milestone:** residents can fake-check themselves in; staff see a clickable room board.

## Module 3: API layer and validation

- Health check, GET rooms, POST check-in routes.
- Server-side validation (required name, valid room, birthday, no check-in to an occupied room).
- Learn environment variables and the browser/server trust boundary.
- **Milestone:** the UI talks to your API, and bad data is rejected.

## Module 4: Real database (Neon)

- Tables: `rooms` (number, status, `facility_id`), `guests` (name, birthday, medical notes, `facility_id`), `stays` (guest, room, check-in time, check-out time, `facility_id`).
- Full CRUD: resident check-in creates a stay and marks the room occupied; check-out ends the stay and marks the room "needs cleaning."
- **Milestone:** data survives refreshes and deploys.

## Module 5: Accounts and security

- Two login types: **residents** (check in / out only, never see other residents' notes or the full board) and **staff** (front desk, housekeeping, admin) who see their facility's board.
- `facility_id` on every user so the current building and the future second building never share data.
- Test with two staff users and two facilities (even if the second building is still under construction).
- **Milestone:** residents can only act on their own stay; staff only see their own center.

## Module 6: Payments (defer or adapt)

- The module assumes a paywalled SaaS. Defer until there is a pilot customer, or use it to charge care centers a monthly subscription (paywall the whole product, not one feature).
- If done, the Stripe webhook writes subscription status to Neon.

## Module 7: AI (optional, later)

- Only a low-risk feature, e.g. a shift-handoff summary of today's check-ins, check-outs, and rooms needing cleaning.
- Do not send resident names, birthdays, or medical notes to a model until privacy is settled.

## After the modules: expansion ideas

Housekeeping task lists, maintenance requests, shift handoff notes, visitor logs, occupancy reports, notifications.

## Suggested checkpoints

1. Live demo with mock data (end of Module 2)
2. Working with a real database (Module 4)
3. Secure multi-user version (Module 5), with resident vs staff split and two facilities. This is the first point at which a demo to the care center makes sense — still with **fake data** until HIPAA is confirmed.

---

## Neon notes: what changes from the bootcamp

Neon is just the Postgres database. Supabase also bundles auth, storage, and an auto-generated API, so a few steps change.

### Module 4 (database)

- No `anon` / `service_role` keys. Neon gives you one **connection string** (`DATABASE_URL`). Treat it as a server-only secret and never expose it to browser code.
- The browser should never talk to the database directly. All reads and writes go through server routes or Server Actions, which matches the API layer built in Module 3.
- Use the Neon SQL Editor (in the Neon console) in place of Supabase's SQL editor.
- Ask the coding agent to use Neon's serverless driver (`@neondatabase/serverless`) or an ORM like Drizzle. Pick one and stay consistent.

### Module 5 (auth and RLS)

- Neon offers **Neon Auth** (Managed Better Auth), which is currently **beta**. Alternatives: self-hosted Better Auth, Clerk, or Auth.js (now part of Better Auth).
- Supabase's `auth.uid()` RLS pattern does not exist on Neon. Neon has its own RLS tooling (originally called Neon Authorize), and Postgres RLS itself still works. Because the app only reaches the database through the server, you can also enforce access in server code (`WHERE facility_id = <the signed-in user's facility>`).
- Recommendation: do both if possible (server-side checks plus RLS), and check Neon's current docs when we reach this module, since this area is evolving.

### Module 6 (Stripe)

Same flow; the webhook updates a Neon table.

### Module 7 (AI)

Neon supports `pgvector` for embeddings.

### Compliance (if handling health information)

- Neon offers HIPAA support on its **Scale plan**, with a signed BAA. Free and Launch plans should not be used for protected health information.
- Neon states that **Managed Better Auth and the Data API are outside its HIPAA boundary** and must not be used for PHI. Plan the auth choice with that in mind.
- Vercel and any AI provider would need to be checked too. Verify current terms directly with each vendor.

### MCP (optional)

Neon's docs suggest setting up its MCP server via `neonctl init`. Still not required. If ever used, point it only at a development branch with fake data.
