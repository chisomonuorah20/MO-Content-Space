# MO Content Space — Next.js web app

A mobile-first, offline-capable creator notebook: quick capture (text, voice, photo, link), an Ideas Library, one-time tasks with optional reminders, a calendar, and a Home dashboard. Built from the **MO Content Space Developer PRD v1.1** and the UX Pilot Home designs (390 × 844 mobile, 1440 × 900 desktop).

> The PRD confirms iOS + Android for the MVP and lists the desktop web build as **OPEN**. This repo is the responsive web implementation; the data model, copy registry and design tokens are shared-ready for a React Native build.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

With no environment variables the app runs in **local-only mode**: you enter a first name, and everything is stored on that device in IndexedDB. The sync pill says "Local only — cloud backup off". The UI never claims data is backed up.

To try it with content, open **Settings → Sample data → Load sample ideas and tasks**. Every sample item is flagged and badged "Demo" (PRD §15.4 note 2).

## Turn on cloud backup and sync (Supabase)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor. It creates the tables, owner-only RLS on every table, cross-owner reference checks, a server-set `synced_at` cursor and a private `media` storage bucket scoped to `<user_id>/…`.
3. Under Auth, enable Email (magic link) and add your site URL plus `/sign-in` as a redirect URL.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Sign-in then becomes a passwordless email link (the PRD's recommended starting point; the auth method is still OPEN).

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
| Quick Capture (§15.5) | `src/components/quick-capture.tsx`: labelled modes, separate title + body, draft ≠ saved, linked task after save |
| Screens (§15.6) | `src/app/(app)/*`: Home, Ideas, Idea detail, Tasks, Calendar, Reminders, Import (web share intake), Settings |
| Transcription (VOICE-01) | `src/app/api/transcribe/route.ts` |

### Deliberate departures from the generated Home screenshots

Both are allowed by the PRD's source-of-truth order (PRD decisions > copy registry > designs):

- Brand reads **MO Content Space**, not "MO Space" (D-07).
- Copy comes from the registry, so mobile and desktop are identical. For example, "Save a thought, recording, or photo instantly." replaces the two different taglines in the designs, and both layouts show "View Library" and the "N left" badge.
- **Save Link** was added as the fourth capture mode. "High Priority" was dropped because priority isn't in the PRD.
- Lucide icons replace Font Awesome (§15.2), and an initials avatar replaces the stock photo.
- Fixture names ("Alex", "Post to Instagram"…) only appear as Demo data.

## Known limits (web)

- Reminders fire while the app is open, or when it's resumed, and appear in-app with Snooze / Mark Complete. Browser notifications show when permission is granted. Background delivery needs a service worker and push, which isn't built yet. The PRD already says not to promise exact delivery.
- Inbound OS sharing is a native-app feature. On the web, **Import** is the in-app paste/drop equivalent (§15.6).
- Dark mode waits on an approved dark palette (§15.9).
