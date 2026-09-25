# Homestead operations hub: Roadmap

*Single source of truth. Updated after the Homestead Assisted Living meeting, the client's Department Feature Requirements, and the two prototypes (`Prototype_02/` is the main one).*

**Goal:** One operations hub so the **operations manager** can see the building and floor staff stop doing paperwork. **Rooms** (check-in / check-out by room number), **housekeeping**, and **dining** first, then maintenance and activities. A product we can sell to other assisted living buildings. Not a guest self-check-in app. Not a second ECP.

**Stack:** Next.js, Tailwind, **Supabase** (Postgres database, sign-in, file storage, live updates), **Vercel Pro** (hosting). Following the 7-module bootcamp, which already uses Supabase, so no swap is needed.

**Not a HIPAA product.** The app holds room-level operations data only: no resident names, no health information. If we ever build a HIPAA version, it is a separate product on **AWS**, not this stack.

**Next deliverable:** the real backend on Supabase behind the existing screens, then a pilot at Homestead. See **Build plan** below.

---

## What is true (and what is not)

| True | Not true / retired |
|---|---|
| Multi-department **operations** hub | Resident self check-in with a name |
| Rooms, housekeeping, and dining first | Names, contacts, or medical notes in this app |
| **Room numbers only** | Diets, allergies, falls, meds |
| Check-in / check-out is **room occupancy**, not a person record | A guest column or “who is in 104” |
| Clinical work stays in **ECP + Power BI** | Rebuild his admin dashboard |
| Ops manager sees **everything** and sets **who can see what** | Every employee sees every screen |
| New building coming; `facility_id` from day one | One-off app that cannot be copied |
| This app is **outside HIPAA** by design; a HIPAA version would be separate, on AWS | Paying for HIPAA plans (Supabase Team, Vercel BAA) for this app |
| Staff **work emails** (or phone numbers) for sign-in | Resident or family emails on the access list |
| Supabase for database, sign-in and storage | Neon (earlier plan, dropped) |

---

## Client context (from the meeting)

- **Site:** Homestead Assisted Living. Contact is the operations / admin lead (Baker).
- **What he already has:** an admin dashboard in **Power BI**, fed by report downloads from **ECP**. It works. Do **not** rebuild it.
- **Other tools:** ECP, Connect Team (scheduling / time and attendance, free), iSolved (payroll), Google Sheets, Grove Menus (weekly menus), **Sysco** (food ordering; the transcript said "Cisco"), plus his own Claude / Base44 apps.
- **Pain:** housekeeping director and dining manager are stuck on paper. His housekeeping app glitches (see below). His Base44 kitchen app is unreliable and no longer reports.
- **Growth:** a new building is coming, then more. Same playbook per building.
- **Caution from him:** do not put every department in one fragile basket. Each module should work alone and export data. Owners are supportive; **price and timing are open**.
- His department requirements arrived as *Department Feature Requirements* (Sept 2026). Every line is in the prototypes (see **Requirements by area**).

---

## Data rules

What keeps this app simple (and outside HIPAA) is what it refuses to store.

| Holds | Never holds |
|---|---|
| Room numbers, occupancy, stay start / end dates, check-in / check-out **times** (no who) | Resident names, contacts, family details |
| Cleaning jobs, checklists, notes, maintenance requests and photos (of rooms, not people) | Health information: falls, meds, vitals, care plans, 30/90/180-day documents |
| Meal orders by room, menu choices, fridge temps, kitchen checklists, thumbs up / down | Diets, allergies, diet types |
| Activities, attendance **by room number**, room-level feedback | Anything from ECP beyond counts |
| Staff **work email or phone + job** for sign-in | Resident or family emails |

- Cleaning, orders and attendance are keyed by **room number**.
- Check-in means “this room is occupied.” Check-out means “this room needs cleaning.”
- Meal **choice** is a menu item (eggs, soup), not a diet type.
- Fridge log “who” is a **station / role**, not a person name.
- Prefer dropdowns and checkboxes. Every free-text box warns: **no names or health info**.
- Weekly food cost (Sysco bill ÷ people ÷ meals) is **later**, not on the daily dining board. Baker’s Power BI stays the high-level cost view.
- The customer contract should say the app must not be used for resident names or health information. (Product rule, not legal advice.)

---

## How the three modules connect

```
Check in room  →  Occupied
Check out room →  Needs clean  →  Housekeeping Start  →  Finish  →  Vacant (ready for the next check-in)
```

- Housekeeping **only lists rooms that need a clean** (checked out, or already being cleaned / just finished). Occupied or vacant rooms do **not** get a Start button.
- Two clocks stay separate: occupancy (vacant / occupied / needs cleaning) vs cleaning (not started / in progress / done). Do not mix them.

His current housekeeping-app bugs (must not ship):

1. A room marked done flips back to not completed.
2. A phone timer resets, so 17 minutes becomes 2 and wrecks averages.
3. The director board stays on “not started” after staff finish.
4. Only some phones.

**Fix:** the **server** is the only clock. Start and finish are server timestamps. Duration is computed. Start/finish are **idempotent**. The director board updates live. Test on the phones they actually use.

---

## Access control (operations manager)

**Baker** (operations manager) keeps staff **work emails** in **job boxes**. When someone signs in with an email in a box, they get that job’s screens. A shared department PIN is **out** — it hides who signed in and gets confusing when people float between jobs.

Baker sees every box. At least one operations manager must stay in Operations.

| Role | Default access | Website or phone app |
|---|---|---|
| **Operations manager** | Everything, including Access, Weekly pulse, Residents, notices. Cannot be removed. | Both |
| Housekeeping director | Housekeeping + assignments, Weekly pulse, notices | Both |
| Dining manager | All of dining, Weekly pulse, Residents, notices | Both |
| Housekeeper | Their cleans | Phone app |
| Nurse station | Dining → take order, Residents lens | Phone app |
| Kitchen | Dining → queue, menus, temps, checklist | Phone app |
| Maintenance | All requests, change status | Phone app |
| Activities | Calendar + attendance | Phone app |

Everyone can send a maintenance request and see the calendar.

**How access is granted**

1. Baker adds a **work email**. It lands in **New / unassigned**.
2. He opens a job box and **drags** the person in (or uses Move).
3. That person signs in with that email and only sees that job.

**Rules**

- Access is **email → job box → screens**. Do not type resident names on this page.
- A later **shared nurse-station device** option (PIN or short session) is still the “nurse station” job, not a person’s email.
- Each user has a `facility_id`. A housekeeper at building 1 cannot see building 2.
- Changing access is **audited** (who changed what, when).
- The Access screen itself is **ops manager only**.
- Resident or family emails never go on this list.

**How it works on Supabase** (Build plan steps 3–4)

- `staff_accounts` (work email, optional phone, `role` nullable = unassigned, `facility_id`) and `role_access` (which modules each job can open) live in the database, because Baker edits them.
- Open sign-ups are **off**. A Supabase “before user created” check refuses any email that is not in `staff_accounts` with a job.
- After sign-in, the server looks up the job and allowed modules in one query. The database itself (row-level security) refuses rows from another building or a module the job cannot open, so hiding a menu link is never the only guard.
- The website (`/`) only accepts website jobs; everyone else is sent to the phone app (`/app`). Enforced on the server, not just in the page.

---

## Roles (what each job does)

| Role | Job |
|---|---|
| Operations manager | Everything + access control. Today, Weekly pulse, Residents lens. **Not** a clone of Power BI. |
| Housekeeper | Their assigned cleans for today: timer, checklist, notes, maintenance requests |
| Housekeeping director | Assign rooms + repeat days, assign deep cleans, time compliance; gets notes and move-out alerts |
| Nurse station | Order: room, meal, menu choice or special order, dine in / to-go tray; gets ready alerts |
| Kitchen | Incoming + special orders → ready (alerts) → complete; menus, temps, checklist |
| Dining manager | Menus, survey, how meals were served / disliked. Sysco cost and shelf counts later. |
| Maintenance | Every request with photos; moves status to complete (requester is alerted) |
| Activities | Activity calendar with buildings; attendance by room number |

---

## Requirements by area

Client doc: *Department Feature Requirements* (Sept 2026 planning draft). Every line of it is in the prototypes:

| Client ask | Where it lives |
|---|---|
| HK room assignments + repeating routine schedule | `/housekeeping/assign` → owner + weekdays per room; today's routine cleans are generated from it |
| HK room clean checklist | `/housekeeping/clean/[id]` — routine and deep checklists; Finish is blocked until every item is checked |
| HK requests and notes, notify people | Same screen: note → HK director alert; maintenance request → maintenance + ops alert |
| HK time tracking / compliance | Live timer vs target (routine 25 min, deep 90 min); 7-day compliance per housekeeper on Assign |
| HK deep cleans on move-out, assigned per clean | Check out creates an unassigned deep clean + director alert; assign on `/housekeeping/assign` |
| Dining menus uploaded, by meal type | `/dining/menus` — photo or PDF per meal + the dish list staff order from |
| Dining resident orders, dine in vs to-go tray | `/dining/order` — room number stands in for the resident |
| Kitchen incoming + special orders, mark complete | `/dining/kitchen` — special orders on top, then incoming; Ready, then Complete |
| Ready alerts | Ready sends an alert to the nurse station and the person who placed it |
| Maintenance requests with photos | `/maintenance` — up to 3 photos, room or common area, routine / urgent |
| Maintenance status through completion | Open → In progress → Waiting on parts → Complete, with a note trail |
| Activities calendar with building | `/calendar` — every activity needs a building |
| Attendance | Tap the **room numbers** of residents who came |

The client wrote "resident" throughout. The app uses room numbers, never names. Confirm with the client that room numbers are enough for orders and attendance.

**Buildings** are placeholders (Building A/B/C in `Prototype_02/`). Get the real list.

### 1. Rooms (priority 1)

- Check a **room** in (vacant → occupied) with a **stay start date** and **stay end date**. No name field.
- Check a **room** out (occupied → needs deep clean). That creates an unassigned deep clean.
- Board: room, status, stay dates. Click a room to open **that room’s history**.
- **Stay history** (`/rooms/history`) is the spreadsheet of every check-in/out. Filter by room. CSV export comes from this table. Do **not** make a second stay calendar — dates already live on Calendar.
- Cannot check in to an occupied room or a room that still needs cleaning.

### 2. Housekeeping (priority 1)

- Two kinds of clean: **routine** (repeats weekly while the room is occupied) and **deep** (after a move-out).
- Housekeepers see only their own cleans; the director and ops see everyone plus Unassigned.
- Start starts the timer. Finish needs every checklist item. A finished deep clean → room vacant.

### 3. Dining (priority 1)

- **Order entry** at the nurse station: room, meal, choice or special order, dine in / to-go tray.
- **Kitchen queue** live (new → preparing → ready + alert → complete). Special orders listed first.
- **Menus:** upload a photo or PDF per meal type and keep the dish list. Photo → structured menu (AI) is Module 7.
- **End-of-shift kitchen checklist.**
- **Fridge temperature log** per shift. Station + time. **No silent edits.** Confirm state retention.
- **Meal survey:** large thumbs-up / thumbs-down, then **Submit**. Repeat thumbs-down on **Dining counts**.
- **Counts (daily):** how meals were served (dine in / to-go tray from Take order) and what people disliked (2+ thumbs down).
- **Not on this screen:** typing a Sysco bill, dividing by “how many people ate,” leftover gloves/cups. Ask later if they want a separate weekly cost page.

### 4. Access control (priority 1, ops manager)

- See Access control above.

### 5. Maintenance

- `/maintenance`: anyone sends a request (room or common area, photos, routine / urgent). Housekeepers can send one from inside a clean.
- Managers assign a repair to a crew member; the crew moves it along with notes; the sender gets an alert each time.

### 6. Activities (calendar)

- Phone app: month view, shown as **Activities**. Website: week view across every department with risks and staffing.
- Add **what is happening**, a **time**, the **building**, and an optional room.
- Attendance: tap the room numbers of residents who came. Only Activities and ops can change it.

### Alerts

- Bell in the header, `/inbox`. Alerts go to a job (e.g. nurse station) or an email (e.g. the person who sent a request).
- Real delivery (live in-app updates first, then phone push) is Build plan steps 6–7.

### 7. Move-in / move-out with names

- **Out of scope.** Occupancy already lives on Rooms + Housekeeping. Names and contacts stay in ECP.

### 8. Admin summary

- Do not duplicate Power BI.
- New-module reports only. Power BI has a **native PostgreSQL connector**; point it at Supabase (SSL required, read-only database user).

---

## Design

`assisted_living_caregiver_dashboard.html` (CarePulse) and the screenshots in `Prototype_02/reference/` are **look** references, not content specs.

**Keep:** forest green / warm stone / cream palette, serif headings, Inter body, large tap targets, icon tiles, list boards, phone bottom nav.

**Do not copy:** Med Pass, vitals, care plans, resident names, diets, `user-scalable=no`, a live clock in the header.

---

## Prototypes

- `Prototype_02/` (port 3001) is the main demo: one app, one set of data, two surfaces.
  - **Manager website** at `/`, for the operations manager, housekeeping director and dining manager. Layout from the design screenshots: Today (department cards and "Problems to solve"), Weekly pulse (bottlenecks against targets and resident feedback), a week Operations Calendar (risks and staffing counts), a Residents lens by room number, and every department screen. Staff emails are refused here and pointed to the phone app.
  - **Staff phone app** at `/app`, for every job: department home, bottom tabs, month Activities calendar, and the same department screens. Managers can use it too.
  - Data is fake and lives in the browser (`localStorage`). The seed includes 30 days of fake history so the pulse has numbers.
- The older standalone phone prototype (`Prototype_01/`) was folded into `/app` and removed; it is still in git history (commit `dc6c254`).

### Screen map (`Prototype_02/`)

| Website | Phone app | What it is |
|---|---|---|
| `/` | `/app` | Today (website) / department cards (phone) |
| `/pulse` | — | Weekly pulse |
| `/residents`, `/residents/[number]` | — | Residents lens by room number |
| `/calendar` | `/app/calendar` | Week calendar (website) / month Activities (phone) |
| `/rooms`, `/rooms/history` | same under `/app` | Check-in / check-out, stay history |
| `/housekeeping`, `/housekeeping/assign`, `/housekeeping/clean/[id]` | same under `/app` | Cleans, assignments, one clean |
| `/dining/*` | same under `/app` | Order, kitchen queue, menus, temps, checklist, survey, counts |
| `/maintenance` | `/app/maintenance` | Requests, photos, assigning, status |
| `/inbox` | `/app/inbox` | Alerts |
| `/access` | `/app/access` | Baker: job boxes + unassigned |
| `/signin` | `/app/signin` | Sign in |

---

## Backend: Supabase

**Why Supabase (not Neon, not Clerk):** the access list Baker edits (emails → jobs → allowed screens) has to live in our database anyway. With Supabase, sign-in, that list, the data, and the photos are in one place, so “who is this and what can they open” is one query, and the database itself can refuse the wrong building’s rows. Clerk would add a second system to keep in sync, and its allowlist and custom roles are paid features. Neon would need separate sign-in and storage.

**Plans**

- **Free** plan projects pause after about a week of low activity. Fine for a dev project, not for customers.
- **Pro** ($25/month per organization) never pauses, keeps 7 days of backups, and includes $10/month of compute (one small database). Extra always-on projects in a Pro organization cost about $10/month each.
- Plan is per **organization**. Use a Free organization for `homestead-dev` and a Pro organization for `homestead-prod`.
- We do **not** need Team ($599/month) or the HIPAA add-on.

**Sign-in**

- **Email code** (6 digits) to the work email is the default. Codes work better than links on phones, because a link opens the browser instead of the home-screen app.
- Supabase’s built-in email sender is limited to 2 emails an hour and is not for production. Send through **Resend** (free up to 3,000 emails a month, 100 a day) or another SMTP service.
- **Phone code by text** only for staff without a work email, through **Twilio Verify**. See costs below.
- Long sessions on personal phones (people rarely need a new code). Shared nurse-station devices get a later PIN / short-session option.

**Monthly running cost (one building)**

| Item | Cost |
|---|---|
| Supabase Pro (prod) | $25 |
| Supabase Free (dev) | $0 |
| Vercel Pro (1 seat; Hobby does not allow commercial use) | $20 |
| Resend email codes (under 3,000 a month) | $0 |
| Domain | about $1–2 (billed yearly) |
| Text-message codes, if used | about $2–40 (below) |
| **Total** | **about $45–50**, plus texts if used |

**Text-message codes (Twilio Verify):** about **$0.058 per code** in the US ($0.05 per successful verification + $0.0083 per text). No phone number or carrier registration to manage. Per building with about 30 staff:

| How often each person gets a code | Codes a month | Cost a month |
|---|---|---|
| About twice a month (long sessions on their own phone) | 60 | about $3.50 |
| About weekly | 130 | about $7.50 |
| Every shift (shared devices, short sessions) | 660 | about $38 |

Sending texts directly through Twilio (not Verify) is about $0.012–0.015 a text plus a $1.15/month number and US carrier (A2P 10DLC) registration fees. Cheaper at high volume, more paperwork; not worth it for one building. Turn on rate limits and CAPTCHA so nobody can run up the text bill.

**Existing project:** a Supabase project is already connected to Cursor (`uiczrlhezopwsfzdjszc`). Its database did not respond (likely a paused Free project). Decide whether it becomes `homestead-dev` or start fresh.

---

## Build plan (step by step)

Each step keeps the existing screens and the Playwright suite green. Fake data until step 10.

0. **Accounts.** Supabase (Free org for dev; Pro org for prod when step 9 starts), Vercel Pro, Resend, a domain, the GitHub repo. Install the Supabase CLI and keep database changes as migration files in the repo.
1. **Projects.** `homestead-dev` (Free) and `homestead-prod` (Pro). Local Supabase (`supabase start`) for tests.
2. **Tables** — **done on dev** (project `nglpmviaarbogpcuhiai`). Migrations in `supabase/migrations/`, demo data in `supabase/seed.sql`, database tests in `supabase/tests/database/` (116 passing). 30 tables, every one with `facility_id` and row-level security; access rules follow `role_access`; the server stamps every time; clean, order and room steps only move forward; the fridge log is append-only; check-in / check-out are single all-or-nothing calls. Private Storage buckets and Realtime are set up too (used in steps 5–6).
   No columns for resident names, diets, or medical data.
3. **Sign-in.** Email codes through Resend; open sign-ups off; “before user created” check against `staff_accounts`; server-side route guard (website jobs vs phone app; job → modules). Replace the fake `/signin` and `/app/signin`.
   **Partly done on dev:** `/signin` and `/app/signin` send a 6-digit email code (Supabase’s built-in sender for now, about 2 emails an hour) and read the job from `staff_accounts`; the before-user-created hook blocks emails that aren’t on the list. The demo sign-in stays below it. Still to do: Resend, the server-side route guard, and removing the demo once the data is real (step 4).
4. **Server actions.** Replace each action in `lib/store.tsx` (check in/out, start/finish clean, orders, temps, requests, attendance, access moves…) with a server action that validates and stamps **server** time. Start/finish idempotent. Bad data is rejected. The UI barely changes.
5. **Photos and menu files** in private Supabase Storage buckets, per facility, shown through short-lived links.
6. **Live updates** with Supabase Realtime: kitchen queue, director board, alert bell. This is what kills “board stays on not started.”
7. **Alerts to phones.** In-app first (step 6), then web push for the home-screen phone app. Email alerts optional.
8. **Tests.** Point Playwright at local Supabase with the seed; add tests for sign-in, the before-user-created block, cross-building isolation, and server timestamps.
9. **Deploy.** Vercel Pro + `homestead-prod` + domain. Error monitoring (e.g. Sentry free tier), uptime check, confirm daily backups restore.
10. **Pilot at Homestead.** Real room list, buildings, staff emails; real phones (check the four housekeeping bugs by hand). Power BI read-only connection if he wants it.
11. **Ready to sell.** New-building onboarding without code (create facility, invite its first ops manager), CSV exports per module, Stripe billing (Module 6), terms, privacy policy, customer contract, pricing.

---

## Modules (bootcamp mapping)

### Brief (paste into Module 1, Step 1)

> A web app that helps assisted living buildings replace paper. A manager website for the operations manager and department leads, and a phone app for floor staff, sharing one database. Staff check rooms in and out by room number only — no resident names. After checkout, housekeeping starts and finishes the clean. Nurse stations enter meal orders by room; the kitchen sees them live. The kitchen logs fridge temperatures and checklists; staff submit thumbs up/down on meals. Maintenance requests with photos, an activities calendar with attendance by room number. The operations manager adds staff work emails to an Unassigned box and drags them into a job; sign-in with that email opens only that job’s screens. It never stores resident names or health information. Each user sees only their role and their building. Stack: Next.js, Tailwind, Supabase, Vercel.

| Bootcamp module | Build plan steps | Status |
|---|---|---|
| 1. Setup and deploy | 0, 9 | Prototype runs locally |
| 2. Mock UI | — | **Done** (`Prototype_02/`) |
| 3. API and validation | 4 | Next |
| 4. Database (Supabase) | 1, 2, 5 | Next |
| 5. Accounts | 3 | Next |
| 6. Payments | 11 | Later — he wants to see the product first |
| 7. AI | later | Menu photo → structured menu; cost and “most disliked meals” summaries. Never send names or health details to a model. |

---

## Integrations (all later; v1 stands alone)

| System | Role | Now |
|---|---|---|
| **ECP** | Healthcare records. REST API is surface-level (mostly reports). | Not needed. Health data stays there. |
| **Connect Team** | Scheduling / attendance | Later: feed staffing counts on the week calendar. |
| **iSolved** | Payroll | Not needed. |
| **Grove Menus / Sheets** | Weekly menus | Our menu could replace or feed this. |
| **Sysco** | Food invoices | Manual totals → cost math, later. |
| **Power BI** | His 30,000-foot view | Keep. Read-only connection to Supabase after step 9. |

---

## Checkpoints

1. **Mock demo** — done (`Prototype_02/`, website + phone app, fake data).
2. **Real backend on dev** (steps 1–8) — data survives refresh, sign-in with email codes, housekeeping bugs cannot be reproduced.
3. **Pilot at Homestead** (steps 9–10) — real rooms and staff, real phones.
4. **Second building / second customer** (step 11).

---

## Open questions

1. Do housekeepers, kitchen and maintenance staff have **work emails**, or do we need **phone-number sign-in**?
2. **Devices:** personal phones, shared tablets, nurse-station computers? Decides session length and whether a station PIN is needed.
3. Real **building list** and room numbers.
4. Copy of his **housekeeping app** and which phones glitch.
5. **Fridge log:** exact state rule, retention, format.
6. **New building** timeline.
7. **Price, ownership,** and selling to other sites (per building per month?).
8. ~~Reuse the connected Supabase project for dev, or start fresh?~~ Fresh project `nglpmviaarbogpcuhiai` is dev.

---

## Review notes

- Power BI **can** talk to Postgres (Supabase). SSL required.
- “Cisco” in the transcript is **Sysco**.
- Meal “choice” ≠ diet restriction.
- Survey is pick a thumb, then Submit — not an instant save toast.
- Neon was the earlier database plan; replaced by Supabase because sign-in and storage come with it.
