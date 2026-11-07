# MO Content Space — Next.js web app

A mobile-first, offline-capable creator notebook: quick capture (text, voice, photo, link), an Ideas Library, one-time tasks with optional reminders, a calendar, and a Home dashboard. Built from the **MO Content Space Developer PRD v1.1** and the UX Pilot designs (390 × 844 mobile, 1440 × 900 desktop) for every screen: Welcome, Onboarding, Sign in, Create account, Password recovery, Home, Quick Capture menu, Write Idea, Record Voice, Capture Media, Share/Import, Ideas Library, Idea Detail, Edit Idea, Platform Plans, Voice Recording detail, Tasks overview and Task Composer.

> The PRD confirms iOS + Android for the MVP and lists the desktop web build as **OPEN**. This repo is the responsive web implementation; the data model, copy registry and design tokens are shared-ready for a React Native build.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

With no environment variables the app runs in **local-only mode**: Create Account asks only for your name (no password, since nothing leaves the device), and everything is stored in IndexedDB. The sync pill says "Local only — cloud backup off", and the Welcome screen says "Private to this device" instead of "Encrypted & Private" / "Cloud Backup". The UI never claims data is backed up.

To try it with content, open **Settings → Sample data → Load sample ideas and tasks**. Every sample item is flagged and badged "Demo" (PRD §15.4 note 2).

## Turn on cloud backup and sync (Supabase)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor. It creates the tables, owner-only RLS on every table, cross-owner reference checks, a server-set `synced_at` cursor and a private `media` storage bucket scoped to `<user_id>/…`.
3. Under Auth, enable Email (magic link) and add your site URL plus `/sign-in` as a redirect URL.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Sign-in then uses email + password, as in the UX Pilot auth frames, with "Forgot?" password recovery (`/forgot-password` → emailed link → `/reset-password`). Add `<your-site>/reset-password` as an allowed redirect URL too.

## Turn on transcription

Set `TRANSCRIPTION_API_KEY` (any OpenAI-compatible `/audio/transcriptions` API; the provider is OPEN in the PRD). Transcription only runs when the user taps **Transcribe** and accepts the consent notice. The original audio is never changed, and the transcript is editable.

## How the PRD maps to the code

| PRD area | Where |
|---|---|
| Design tokens (§15.2) | `src/app/globals.css` `@theme`: semantic names only, with no hex values in screens |
| Shared copy registry (§15.4, UI-01) | `src/lib/copy.ts`: every string; status comments mark OBSERVED / PROPOSED / ADDED |
| Data model (§4) | `src/lib/types.ts`, `src/lib/db.ts` (Dexie/IndexedDB) |
| Local-first writes + outbox (§5.1, SYNC-01) | `src/lib/repo.ts`: each mutation writes the entity and the outbox entry in one transaction |
| Sync engine, conflicts (§5.2) | `src/lib/sync.ts`: media first, then the row, then acknowledge; pull by server cursor; idea text conflicts keep a "(cloud copy)" |
| Reminders, Snooze/Complete (REM-01/02) | `src/lib/reminders.ts`, `ReminderItem` in `src/components/cards.tsx` |
| Quick Capture (§15.5) | `src/components/capture-menu.tsx` → `src/app/(app)/capture/{write,record,media}`; draft ≠ saved; linked task after save |
| Share intake (SHARE-01) | `src/components/import-dialog.tsx`, `src/app/manifest.ts` (`share_target`), `src/app/(app)/share` |
| Auth + onboarding (AUTH-01) | `src/lib/auth.ts`, `src/app/{welcome,sign-in,register,forgot-password,reset-password,onboarding}` |
| Screens (§15.6) | `src/app/(app)/*`: Home, Ideas, Idea detail / edit / platform plans / voice detail, Tasks, Calendar, Reminders, Settings |
| Tasks (TASK-01, REM-01) | `src/app/(app)/tasks`, `src/components/task-composer.tsx` |
| Transcription (VOICE-01) | `src/app/api/transcribe/route.ts` |

### Where the build differs from the UX Pilot frames

The PRD's source-of-truth order is PRD decisions > copy registry > designs, so these deliberately differ from the frames:

- Brand reads **MO Content Space**, not "MO Space" (D-07: shortened wordmark only after explicit approval). It's one string, `brand.full` in `src/lib/copy.ts`.
- Onboarding says "Transcribe on demand" and "Categories" instead of "Auto-Transcript" and "Mood Boards" (VOICE-01 forbids automatic transcription; mood boards aren't MVP).
- Capture Media says it accepts images only. The frame mentions PDFs, but document uploads aren't MVP-confirmed (MEDIA-01).
- "High Priority" task labels were left out, because priority isn't in the PRD data model.
- The standalone "Quick Capture" modal frame (Write/Record/Photo tabs) is replaced by the Quick Capture menu, which leads to the full Write / Record / Capture Media screens. The PRD calls that modal exploratory (§15.5).
- Fixture text in the frames ("Alex", "alex@creator.space") appears only as clearly marked demo data or isn't used.
- Where a mobile and desktop frame used different words for the same thing, one wording is used on both (§15.3 copy parity). Capitalisation differences are CSS only.
- Copy comes from the registry, so mobile and desktop are identical. For example, "Save a thought, recording, or photo instantly." replaces the two different taglines in the designs, and both layouts show "View Library" and the "N left" badge.
- **Save Link** was added as the fourth capture mode. "High Priority" was dropped because priority isn't in the PRD.
- Lucide icons replace Font Awesome (§15.2), and an initials avatar replaces the stock photo.
- Fixture names ("Alex", "Post to Instagram"…) only appear as Demo data.

## Known limits (web)

- Reminders fire while the app is open, or when it's resumed, and appear in-app with Snooze / Mark Complete. Browser notifications show when permission is granted. Background delivery needs a service worker and push, which isn't built yet. The PRD already says not to promise exact delivery.
- Inbound sharing: installed as a web app (Add to Home Screen), Android/Chrome lists MO Content Space in the system share sheet via the manifest `share_target`, which opens the Share dialog. Elsewhere, **Quick Capture → Save Link** opens the same dialog for pasting.
- Decorative images on Welcome, auth and onboarding are hot-linked from UX Pilot's storage (`src/lib/brand.ts`). Copy them into `/public` before launch. Each sits on a brand-colour fallback.
- Link previews show the site name and URL only. Fetching titles and images from third-party pages server-side needs SSRF safeguards first (SEC-01).
- Dark mode waits on an approved dark palette (§15.9).
