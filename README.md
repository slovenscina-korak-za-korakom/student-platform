# Slovenščina Korak za Korakom

**The production platform of a Slovenian language school, designed, built, and run by one engineer.**

Live at **[slovenscinakzk.com](https://slovenscinakzk.com)** · Admin panel: [slovenscina-admin](<!-- TODO: link to admin repo -->)

<!-- TODO: add a screenshot or short GIF of the student dashboard and booking flow here -->

---

## The problem

Slovenščina Korak za Korakom teaches Slovenian online and in person. Most learners live in Slovenia, with others in Serbia, Russia, and Ukraine. Until 2026 the school ran on Excel, Google Calendar, and Telegram: tutors' hours were tallied by hand and scheduling happened across three tools.

I replaced that with this platform, the student-facing app, and a separate [admin panel](<!-- TODO: link to admin repo -->) for staff.

## Where it stands

- **350+ registered learners** and **10 staff** on the platform, operational since January 2026
- **80–100 lesson-hours per week** booked and scheduled through it
- Student app available in **4 languages**: Slovenian, English, Italian, and Russian
- Supports a learner community of **2,100+ members** on Telegram
- Hosting cost close to zero (Vercel and pay-per-use AWS)

---

## Engineering highlights

### 1. Encrypted, enrollment-gated course streaming

The school's first video course (10 modules, about 3.5 hours of video, plus exercises, grammar PDFs, flashcards, and exams) is paid content, so the videos must not be downloadable by anyone who hasn't paid.

- Videos are packaged as **HLS with AES-128-encrypted segments**.
- The **manifest and decryption key** live in a **private S3 bucket** and are only served through enrollment-gated API routes. Every request is checked against the learner's access before anything is returned.
- The encrypted `.ts` segments are fetched through **short-lived presigned S3 URLs**, so a copied link expires quickly and is useless without the key.
- **No plain source URL ever reaches the browser.**
- **Ingest is automated:** the admin panel uploads a video through an authenticated ingest API, and an **S3-triggered AWS Lambda running ffmpeg** packages it into encrypted HLS. Nobody runs ffmpeg by hand.

**Trade-off:** encryption plus gating stops downloading and link sharing. It can't stop someone screen-recording a video they have legitimately paid for, and no web platform can. Full DRM (Widevine or FairPlay) would need a paid licensing service, which isn't proportional for a single course.

### 2. Scheduling across time zones

Learners book from several countries, and tutors set availability in their own local time. Sessions are stored with their **IANA time zone** (for example `Europe/Ljubljana`), not a fixed UTC offset. Learners can pick their zone, and the app detects when their device's time zone changes.

This design came out of a real production bug, described in the [admin panel README](<!-- TODO: link to admin repo -->).

### 3. Four languages from one codebase

All student-facing content is localized with `next-intl` and locale-prefixed routes, so a learner can use the whole app (booking, payments, emails, course UI) in their own language while learning Slovenian.

### 4. Payments and onboarding

- **Stripe** handles lesson and course payments, with webhooks keeping bookings and enrollment in sync.
- New learners go through a **placement test and tutor matching** before their first lesson.
- **Transactional emails** (booking confirmations and updates) are sent with Resend and React Email.

---

## How it was built

I'm the only engineer on the platform. I worked with an **AI-assisted workflow (Claude Code)** for implementation, refactoring, and tests, and reviewed every change myself. On the admin panel, end-to-end tests run in GitHub Actions and must pass before Vercel deploys.

**Stack:** Next.js · TypeScript · PostgreSQL (Drizzle ORM) · Clerk · Stripe · AWS S3 and Lambda · Vercel

## What I'd improve next

- **Error monitoring.** A self-hosted Prometheus/Grafana setup doesn't fit serverless hosting, so the next step is a hosted error tracker. Right now, users report problems before I see them.
- **Automated tests for the student app,** starting with the enrollment gate. It decides who gets paid content, so it's the most important route to cover.

<details>
<summary>Running locally</summary>

```bash
bun install
cp .env.example .env   # fill in Clerk, Stripe, database, and AWS values
bun run db:push
bun run dev
```

</details>
