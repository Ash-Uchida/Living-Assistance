# Care Center Software: Roadmap (HIPAA applied)

**What this file is:** The path for **real residents** at this HIPAA-covered center.

**What this file is not:** The file to follow during the bootcamp. Build on fake data with [ROADMAP-NO-HIPAA.md](ROADMAP-NO-HIPAA.md) first. Switch here before the first real name is saved.

**Goal:** Replace paper check-in. Residents check themselves in and out. Staff see live room status.

**Stack:** Next.js, Tailwind, Neon Scale (Postgres) + BAA, Vercel Pro + HIPAA BAA. Self-hosted Better Auth (not Neon Auth). Same 7-module app as the other roadmap; different plans and auth.

**Working rule:** Every time a bootcamp prompt says "Supabase," tell the coding agent: *"We are using Neon (Postgres) instead of Supabase. This is the HIPAA path: no Neon Auth, no Data API, no real PHI until Scale and BAAs are on."*

**Lean live vendor cost:** about **$410–550 / month** (always-on front desk ≈ **$535 / month**). First year with policies and insurance: about **$10,000–25,000**. Paying invoices is not the same as being compliant.

---

## Why this file exists

This center is a **HIPAA covered entity**. v1 does **not** store medical notes. That is a product cut, not a workaround. Name + room + stay times at this facility are still PHI.

HHS says a cloud vendor that stores ePHI is still a business associate **even if the data is encrypted and they do not have the key**. See [HHS FAQ 2076](https://www.hhs.gov/hipaa/for-professionals/faq/2076/if-a-csp-stores-only-encrypted-ephi-and-does-not-have-a-decryption-key-is-it-a-hipaa-business-associate/index.html). Encryption does not let you stay on Free Neon or Hobby Vercel.

---

## Database: Neon Scale (not Supabase, not self-hosted SQL)

Stay on Neon so the two roadmaps share one codebase. For live PHI, upgrade that same project to **Scale**, accept the BAA, and enable HIPAA on the project.

| | Neon Scale + BAA | Supabase Team + HIPAA | Self-hosted SQL |
|---|---|---|---|
| Engine | Postgres | Postgres | Postgres |
| Fits this app | Browser never talks to the DB | Often browser + anon key + RLS | You run every control |
| Auth | Neon Auth is **outside** HIPAA. Use self-hosted Better Auth. | Confirm Auth is in the BAA | You own it |
| Typical floor | Usage; ~$40–165 for this app | $599 + HIPAA add-on (community figure ~$350) | Cheap host, expensive you |

Do not self-host Postgres unless someone is paid to run HIPAA operations.

**Always-on:** disable scale-to-zero (or keep 1 CU up) so the front desk does not wait on a cold start. 1 CU always-on ≈ 730 × $0.222 ≈ **$165 / month** + a little storage.

---

## Before go-live: product (same as the other file)

> A web app for a HIPAA-covered care center that replaces paper check-in. Residents check themselves in and out by name and room. Staff see live room status (available, occupied, needs cleaning, maintenance). Medical notes stay in the center's existing records — this app does not store them. We start with one facility and design for a second building in town.

### Product decisions

- **Who uses it?** Residents check in/out. Staff watch the board. No extra workflows in v1.
- **What this app stores:** Name, room, check-in time, check-out time.
- **What this app does not store:** Medical notes, birthday, diagnoses, meds. Those stay in the existing chart.
- **HIPAA:** Covered entity. The roster is PHI. Residents never see other residents. Staff only see their `facility_id`.
- **Two buildings:** `facility_id` on every table. One open now; one under construction in town.

---

## What you pay for (September 2026)

Confirm every number with the vendor. This is a budget, not a legal sign-off. The center still needs a risk analysis, policies, and training.

| Item | Why | Published price | When |
|---|---|---|---|
| Vercel Pro | Hobby cannot sign a BAA | $20 / mo | First real name |
| Vercel HIPAA BAA | The app server processes resident names and stays | $350 / mo | First real name |
| Neon Scale + BAA | Only Neon plan that offers HIPAA | ~$40–80 if the DB may sleep; ~$165 for 1 CU always-on | First real name |
| Neon HIPAA surcharge | $0 now; Neon says 15% may come later | $0 now | If/when they bill it |
| Auth | Self-hosted Better Auth in the Next.js app; sessions in Neon | $0 | Keep from Module 5 |
| Hosted auth instead | Clerk / Auth0 BAA is Enterprise / quote | $500–2,000+ / mo | Only if you will not run auth |
| Email | BAA only if mail contains PHI | ~$0–20 / mo if mail is just magic links | Launch |
| Error monitoring | Strip names from logs or get a BAA | $0 if stripped | Launch |
| AI | Names to a model need another BAA | Skip | Do not buy |

**Lean total: $410–550 / month.** Vercel $370 is most of it.

**Heavier:** $1,000–2,500+ / month with Clerk/Auth0, or about $1,320 / month on Supabase Team + HIPAA add-on + Vercel.

**First year:** ~$6,400 vendors + $2,000–15,000 policies/training + $1,000–4,000 insurance ≈ **$10,000–25,000**.

Do not buy any of this while you are still on fake data.

---

## Encryption (do this; it does not skip plans)

- **In transit:** HTTPS only.
- **At rest:** Neon already encrypts disks.
- **App-level (optional later):** encrypt name (and any later sensitive fields) before `INSERT`, decrypt only for staff who are allowed to see that stay. Helps if a dump leaks and keys do not. Does **not** remove BAA requirements. The Next.js server still sees plaintext when staff view the board.

---

## Modules (same app, different constraints)

The screens and tables match [ROADMAP-NO-HIPAA.md](ROADMAP-NO-HIPAA.md). Differences are called out.

### Module 1–3

Same pages, same mock data, same API and validation. Deploy wherever you want while data is fake. **Do not enter a real resident.**

### Module 4: Database

- Same tables: `rooms`, `guests` (name only), `stays`. No notes column.
- Before real data: upgrade to Neon **Scale**, accept the BAA, enable HIPAA on the project (irreversible; restarts compute).
- `DATABASE_URL` server-only. No Data API. `@neondatabase/serverless` or Drizzle; stay consistent.
- **Milestone:** fake data first; real names only after Scale + BAA.

### Module 5: Accounts

- Same two login types and `facility_id` isolation.
- **Do not use Neon Auth or the Data API.** They are outside Neon's HIPAA boundary.
- Use **self-hosted Better Auth** in the Next.js app (sessions in Neon). That keeps auth under the Vercel + Neon BAAs.
- Server checks plus Postgres RLS if you can.
- **Milestone:** residents act only on their own stay; staff see only their facility.

### Module 6: Payments

Defer, or subscribe the center. Stripe webhook writes to Neon. If Stripe sees PHI, they need their own BAA — keep billing as "facility subscription," not resident data.

### Module 7: AI

Skip for real names unless that vendor has a BAA and the center approves it. A handoff summary that only says "3 check-ins, 2 rooms need cleaning" with **no names** is the only low-risk version.

## After the modules

Housekeeping lists, maintenance requests, visitor logs, occupancy reports, notifications. Each new field that identifies a resident is still PHI.

## Checkpoints

1. Mock-data demo (end of Module 2) — other roadmap
2. Real database with **fake** people (Module 4) — other roadmap
3. Secure multi-user, still fake (Module 5) — last demo before you spend money
4. **This file:** Scale + BAAs + Better Auth, then the first real resident

---

## Neon / Vercel rules for PHI

- Free and Launch Neon: no PHI.
- Managed Better Auth and Data API: no PHI.
- Vercel Hobby: no PHI. Pro + HIPAA add-on before go-live.
- MCP (`neonctl init`): optional, and only on a **fake-data** branch.
- Verify current BAA terms with each vendor. This is not legal advice.

---

## Switch checklist (no-HIPAA build → this file)

1. Center policies, training, and a risk analysis are in motion (their job, not the bootcamp).
2. Vercel: Pro + HIPAA BAA add-on.
3. Neon: Scale, org BAA, HIPAA enabled on the project.
4. Auth is self-hosted Better Auth. Neon Auth is off.
5. Logs and error tools do not print resident names.
6. No AI with names.
7. Then — and only then — save a real person.
