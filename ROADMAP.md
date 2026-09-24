# Homestead operations hub: Roadmap

*Single source of truth. Updated after the Homestead Assisted Living meeting, the CarePulse look, and the Module 2 demo in `web/`.*

**Goal:** One operations hub so the **operations manager** can see the building and floor staff stop doing paperwork. **Rooms** (check-in / check-out by room number), **housekeeping**, and **dining** first. Then maintenance and activities. Not a guest self-check-in app. Not a second ECP.

**Stack:** Next.js, Tailwind, Neon (Postgres), Vercel. Following the 7-module bootcamp.

**Working rule:** Every time a bootcamp prompt says "Supabase," tell the coding agent: *"We are using Neon (Postgres) instead of Supabase."*

**This week's deliverable:** clickable Module 2 prototype (rooms + housekeeping + dining + access control, fake room-only data).

---

## What is true (and what is not)

| True | Not true / retired |
|---|---|
| Multi-department **operations** hub | Resident self check-in with a name |
| Rooms, housekeeping, and dining first | Names, contacts, or medical notes in this app |
| **Room numbers only** in v1 | Diets, allergies, falls, meds |
| Check-in / check-out is **room occupancy**, not a person record | A guest column or “who is in 104” |
| Clinical work stays in **ECP + Power BI** | Rebuild his admin dashboard |
| Ops manager sees **everything** and sets **who can see what** | Every employee sees every screen |
| New building coming; `facility_id` from day one | One-off app that cannot be copied |
| HIPAA is **unsettled** on **resident** room data — ask an advisor | We already decided room-only is / is not PHI |
| Staff **work emails** for login are workforce identity, not patient records | Resident or family emails on the access list |
| Demo uses **fake data** | Live real rooms before that advice |

The first `web/` demo stored fake **names** on a check-in board. That is retired. Check-in stays; names do not.

---

## Client context (from the meeting)

- **Site:** Homestead Assisted Living. Contact is the operations / admin lead.
- **What he already has:** an admin dashboard in **Power BI**, fed by report downloads from **ECP**. It works. Do **not** rebuild it.
- **Other tools:** ECP, Connect Team (scheduling / time and attendance, free), iSolved (payroll), Google Sheets, Grove Menus (weekly menus), **Sysco** (food ordering; the transcript said "Cisco"), plus his own Claude / Base44 apps.
- **Pain:** housekeeping director and dining manager are stuck on paper. His housekeeping app glitches (see below). His Base44 kitchen app is unreliable and no longer reports.
- **Growth:** a new building is coming, then more. Same playbook per building.
- **Caution from him:** do not put every department in one fragile basket. Each module should work alone and export data. Owners are supportive; **price and timing are open**.
- **He will text** a list of key requirements per department. Merge into this file when it arrives.
- **We promised** a prototype in about a week.

---

## Data zones

Neither we nor the client should decide HIPAA. Until a qualified advisor does, build in zones:

| Zone | Holds | Modules | Status |
|---|---|---|---|
| **A: Room-level operations** | Room numbers, occupancy, check-in / check-out **times** (no who), cleaning tasks, orders by room, temps, checklists, thumbs on menu items, supply counts, a **census number**, **staff work emails + job** for sign-in | Rooms, housekeeping, dining, access control | **Build now**, fake or room-only data |
| **B: Names and contacts** | Resident name, contact, move-in/out dates | Move-in / move-out with identity | **Blocked** |
| **C: Health information** | Falls, 30/90/180/annual documents, meds, vitals, care plans, **diets, allergies** | Not this product | **Stays in ECP / Power BI** |

**Zone A rules**

- No resident names. No “guest” field. Cleaning and orders are keyed by **room number**.
- Check-in means “this room is occupied.” Check-out means “this room needs cleaning.”
- Meal **choice** is a menu item (eggs, soup), not a diet type.
- Weekly food cost (Sysco bill ÷ people ÷ meals) is **later**, not on the daily dining board. If we add it, use a typed headcount — not a resident list. Baker’s Power BI stays the high-level cost view.
- Fridge log “who” is a **station / role**, not a person name.
- Prefer dropdowns and checkboxes. Any free-text box must warn: **no names or health info**.
- Access stores **employee work emails and job titles** so staff can sign in. That is workforce identity (who may use the app), not a resident or patient record. **Do not store resident or family emails here.**
- Small buildings make room numbers easier to reverse-engineer. Ask an advisor before real data goes live.
- **Fake data only** until that answer.
- This file is a product rule, **not legal advice**. A healthcare compliance attorney still answers whether Zone A room data is PHI.

---

## How the three modules connect

```
Check in room  →  Occupied
Check out room →  Needs clean  →  Housekeeping Start  →  Finish  →  Vacant (ready for the next check-in)
```

- Housekeeping **only lists rooms that need a clean** (checked out, or already being cleaned / just finished). Occupied or vacant rooms do **not** get a Start button.
- There is **no notification ping** yet. Housekeeping sees the room when they open that tab. A later notification (“Room 104 just checked out”) is optional.
- Two clocks stay separate: occupancy (vacant / occupied / needs cleaning) vs cleaning (not started / in progress / done). Do not mix them.

His current housekeeping-app bugs (must not ship):

1. A room marked done flips back to not completed.
2. A phone timer resets, so 17 minutes becomes 2 and wrecks averages.
3. The director board stays on “not started” after staff finish.
4. Only some phones.

**Fix:** the **server** is the only clock. Start and finish are server timestamps. Duration is computed. Start/finish are **idempotent**. Test on the phones they actually use.

---

## Access control (operations manager)

**Baker** (operations manager) keeps staff **work emails** in **job boxes**. When someone signs in with an email in a box, they get that job’s screens. A shared department PIN is **out** — it hides who signed in and gets confusing when people float between jobs.

Baker sees every box. At least one operations manager must stay in Operations.

| Role | Default access (v1) |
|---|---|
| **Operations manager** | Rooms, housekeeping, dining (all), **Access control**. Cannot be removed. |
| Housekeeper | Housekeeping only |
| Housekeeping director | Housekeeping only |
| Nurse station | Dining → take order |
| Kitchen | Dining → queue, temps, checklist |
| Dining manager | Dining → survey, counts, queue |

**How access is granted**

1. Baker adds a **work email**. It lands in **New / unassigned**.
2. He opens a job box and **drags** the person in (or uses Move).
3. That person signs in with that email and only sees that job.

**Boxes**

- New / unassigned (new hires and people with no job yet — they cannot sign in)
- Operations (Baker; everything)
- Housekeeping, HK director, Nurse station, Kitchen, Dining manager

**Backend (Module 4 / 5, not this demo)**

- `staff_accounts`: work email, `role` (nullable = unassigned), `facility_id`
- `role_access`: which modules each job can open
- Baker’s account is `ops_manager` and cannot lose the last Operations seat

**Rules**

- Access is **email → job box → screens**. Do not type resident names on this page.
- Do **not** use one PIN per department for personal login. A later **shared nurse-station PIN** can unlock a station device; that is still the “nurse station” job, not a person’s email.
- Each user also has a `facility_id`. A housekeeper at building 1 cannot see building 2.
- Changing access is an **audited** action later (who changed what, when). Demo can skip the audit log.
- The Access screen itself is **ops manager only**.
- Staff emails here are **not** patient PHI. Resident emails must never go on this list. Ask counsel before a live building uses real staff emails if they sit next to any Zone A room data.

**Demo in `web/`:** `/access` is job boxes plus Unassigned. Drag (or Move) an email into a box. `/signin` is `baker@homestead.demo` and the other assigned demo emails. Header shows the signed-in email.

---

## Roles (what each job does)

| Role | Job |
|---|---|
| Operations manager | Everything + access control. Thin building summary. **Not** a clone of Power BI. |
| Housekeeper | Start / finish rooms that need cleaning |
| Housekeeping director | Same board; later averages / all rooms |
| Nurse station | Order: room, meal, menu choice, dine-in / tray / to-go |
| Kitchen | Queue, fridge temps, end-of-shift checklist |
| Dining manager | Survey + how meals were served / disliked. Sysco cost and shelf counts later. |
| Maintenance | Request list (priority 2) |
| Activities | Events (priority 2) |

---

## Requirements by area

### 1. Rooms (priority 1)

- Check a **room** in (vacant → occupied) with a **stay start date** and **stay end date**. No name field.
- Check a **room** out (occupied → needs cleaning). That creates the housekeeping job.
- Board: room, status, stay dates. Click a room to open **that room’s history**.
- **Stay history** (`/rooms/history`) is the spreadsheet of every check-in/out. Filter by room. A later CSV export can come from this table. Do **not** make a second stay calendar — dates already live on Calendar.
- Cannot check in to an occupied room or a room that still needs cleaning.

### 2. Housekeeping (priority 1)

- List only rooms that need work (needs clean, cleaning, done after turnover).
- One Start **or** Finish per row. About **20 minutes** per room is the working target.
- Finish on a needs-clean room → vacant.

### 3. Dining (priority 1)

- **Order entry** at the nurse station: room, meal, choice, type. Nothing else.
- **Kitchen queue** live (pending → preparing → served).
- **Weekly menu:** breakfast, lunch, dinner. Photo → structured menu is Module 7.
- **End-of-shift kitchen checklist.**
- **Fridge temperature log** per shift. Station + time. **No silent edits.** Confirm state retention.
- **Meal survey:** large thumbs-up / thumbs-down, then **Submit**. No “Saved.” toast as the action. Repeat thumbs-down on **Dining counts**.
- **Counts (daily):** how meals were served (dine-in / tray / to-go from Take order) and what people disliked (2+ thumbs down).
- **Not on this screen:** typing a Sysco bill, dividing by “how many people ate,” leftover gloves/cups. That was confusing next to four real orders, and it is a weekly office task. Ask later if they want a separate weekly cost page.

### 4. Access control (priority 1, ops manager)

- See Access control above. Module 2 already uses job boxes, Unassigned, and email sign-in (fake emails). Module 5 replaces the local list with `staff_accounts` + `role_access`.

### 5. Maintenance and activities (calendar)

- `/calendar` is back. Click a day. Add **what is happening** (activity or maintenance), a **time**, and an optional **room number**.
- Check-in and check-out already have dates; they show on that day as room moves. No names.
- Do not use the old calendar that booked a person into a room.

### 6. Move-in / move-out (later)

- **Zone A** occupancy already lives on Rooms + Housekeeping.
- **Zone B** names and contacts: wait for HIPAA advice.

### 7. Admin summary

- Do not duplicate Power BI.
- New-module reports only. Power BI has a **native PostgreSQL connector**. Neon needs SSL.

---

## Design: CarePulse HTML

`assisted_living_caregiver_dashboard.html` is a **look** reference, not a content spec.

**Keep:** teal / slate, Inter, large tap targets, icon tiles, list boards, mobile bottom nav.

**Do not copy:** Med Pass, vitals, care plans, resident names, diets, `user-scalable=no`, Alpine + CDN, a live clock in the header (we removed it).

**Build instead:** Home with a few big cards; Rooms board; Housekeeping board; Dining hub; Calendar; Access control. Next.js + Tailwind.

---

## Demo map (`web/` today)

| Screen | What it is |
|---|---|
| `/` | Three (or four) cards: Rooms, Housekeeping, Dining, Access |
| `/rooms` | Room check-in / check-out, click a room for its history |
| `/rooms/history` | Spreadsheet of all stays, filter by room |
| `/housekeeping` | Cleaning board for rooms that need it |
| `/dining` | Hub |
| `/dining/order` … `/dining/manager` | Order, queue, temps, checklist, survey, counts |
| `/calendar` | Month of dated activities, maintenance, and room moves |
| `/signin` | Work email on the access list |
| `/access` | Baker: job boxes + unassigned; drag emails |

Navigation is always those main places — not a different menu per role that hides the rest of the product. Access **filters** what a role can open.

---

## Modules

### Brief (paste into Module 1, Step 1)

> A web app that helps Homestead Assisted Living replace paper. Staff check rooms in and out by room number only — no resident names. After checkout, housekeeping starts and finishes the clean. Nurse stations enter meal orders by room; the kitchen sees them. The kitchen logs fridge temperatures and checklists; staff submit thumbs up/down on meals. Baker (operations manager) adds staff work emails to an Unassigned box and drags them into a job; sign-in with that email opens only that job’s screens. It never stores resident names or health information. Each user sees only their role and their building.

### Module 1: Setup and deploy

- Next.js app, GitHub, Vercel.
- Pages: Home, Rooms, Housekeeping, Dining, Access.
- **Milestone:** live URL, those pages exist.

### Module 2: Mock UI (this week)

- Fake rooms, station labels (not people names), fake menu.
- Room occupancy board; housekeeping board; dining jobs; staff email list + sign-in.
- **Milestone:** client demo. Fake data only.

### Module 3: API and validation

- Check in / out; start / finish clean; create order; log temp; checklist; feedback; **update role access** (ops manager only).
- Cannot check in a dirty or occupied room; cannot start a room that does not need cleaning; cannot finish a room that was not started; cannot undo done with a retry.
- **Timestamps from the server.**
- **Milestone:** UI talks to the API; bad data is rejected.

### Module 4: Neon

**v1 tables** (all have `facility_id`): `rooms`, `stays` (room, starts_on, ends_on, checked_in_at, checked_out_at — **no name column**), `cleaning_tasks`, `menu_items`, `meal_orders`, `meal_feedback`, `fridge_temp_logs` (append-only), `checklists`, `checklist_completions`, `supply_usage`, `staff_accounts` (work email + nullable job — **no resident emails**), `role_access` (role, module, allowed).

**Later / now in demo:** `events` (title, kind, starts_at, optional room — **no resident names**), `maintenance_requests`, `access_audit`.

No columns for resident names, diets, or medical data.  
**Milestone:** data survives refresh; the “done reverts” bug cannot be reproduced.

### Module 5: Accounts

- Real login with the same **work email → job** list. Roles + `facility_id`. Enforce `role_access` on the server, not only in the nav.
- Shared nurse-station PIN / short session.
- Test two roles and two buildings.
- **Milestone:** a housekeeper cannot open Dining or Access. Ops manager can.

### Module 6: Payments

Defer. He wants to see the product first.

### Module 7: AI (later, Zone A only)

- Menu photo → structured menu.
- Cost and “most disliked meals” summaries.
- Never send names or health details to a model.

## After the modules

Checkout notifications, maintenance UI, activities calendar, Power BI → Neon.

**Only after HIPAA advice:** names on move-in/out, document due dates, falls. May stay in ECP forever.

---

## Integrations (all later; v1 stands alone)

| System | Role | Now |
|---|---|---|
| **ECP** | Healthcare records. REST API is surface-level (mostly reports). | Ask cost and limits. Do not block the prototype. |
| **Connect Team** | Scheduling / attendance | Later, match staff to shifts. |
| **iSolved** | Payroll | Not needed. |
| **Grove Menus / Sheets** | Weekly menus | Our menu could replace or feed this. |
| **Sysco** | Food invoices | Manual totals → cost math. |
| **Power BI** | His 30,000-foot view | Keep. Connect to our Postgres after Module 4. |

---

## Checkpoints

1. **Mock demo (Module 2)** — this week, fake rooms only, including email sign-in.
2. **Neon (Module 4)** — housekeeping bugs gone on real phones.
3. **Accounts + access (Module 5)** — first possible room-only pilot, **after** HIPAA advice on Zone A.

---

## Open questions

1. **HIPAA on Zone A.** Room-number-only ops data: PHI or not? **Ask a healthcare compliance attorney.** Not an AI.
2. His **requirements text** — merge here when it arrives.
3. Copy of his **housekeeping app** and which phones glitch.
4. **Devices:** phones, tablets, shared nurse-station machines.
5. **ECP API** beyond reports.
6. **Fridge log:** exact state rule, retention, format.
7. Priority 2: **maintenance vs activities**.
8. **New building** timeline.
9. **Price, ownership,** and whether this is sold to other sites later.
10. Which **named staff** map to which roles (Connect Team), without putting resident names in this app.

---

## Neon notes (bootcamp swap)

Neon is Postgres only. Supabase also bundles auth, storage, and an auto API.

**Module 4:** one server-only `DATABASE_URL`. No browser-to-database. `@neondatabase/serverless` **or** Drizzle — pick one.

**Module 5:** Neon Auth is beta. Or Better Auth / Clerk / Auth.js. Enforce `facility_id` and `role_access` in server code; add Postgres RLS if you can.

**If Zone B or C ever happens**

- Neon HIPAA is **Scale + BAA**. Free and Launch are not for PHI.
- Neon Auth and the Data API are **outside** Neon's HIPAA boundary.
- **Zone A stays on Neon + Vercel** for this prototype. Do not pay Scale / Vercel HIPAA for fake room data.

**MCP:** optional. `neonctl init` only on a fake-data branch.

---

## Review notes

- Power BI **can** talk to Postgres. Neon needs SSL.
- “Cisco” in the transcript is **Sysco**.
- Meal “choice” ≠ diet restriction.
- Checkout does not send a push notification yet; it only lands the room on the housekeeping board.
- Survey is pick a thumb, then Submit — not an instant save toast.
- We still do not know if Zone A is outside HIPAA. Removing names does not by itself settle that.
