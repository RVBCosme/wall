# Wall

A 2008-style wall: type a message, press **Share**, and it appears at the top of a live feed. Built with Next.js, React, Tailwind CSS and Supabase.

**Live app:** LIVE_URL

## What it does

- Visitors write a message (up to 280 characters, with a live counter), add their name, and press **Share**. No sign-in needed.
- Every post is saved in a Supabase `posts` table (id, author name, message, timestamp, plus an optional photo).
- The feed shows the newest 50 posts, newest first, and they stay after a page refresh.
- **Live feed:** new posts appear in every open page without a refresh (Supabase Realtime).
- **Photo upload:** attach a JPG, PNG, GIF or WebP (up to 5 MB); it goes to Supabase Storage and shows in the post.

## How the data is protected

The browser only has the Supabase publishable key, so the database enforces the rules itself (`supabase/schema.sql`):

- Row Level Security: anyone can read and add posts; nobody can edit or delete them.
- Check constraints: names 1-40 characters, messages 1-280 characters, and photo links must point to this project's `wall-photos` bucket.
- A trigger sets each post's id and time on the server, so a post cannot be backdated or pinned.
- The `wall-photos` bucket accepts images only, up to 5 MB.

## Stack

- Next.js 16 (App Router) and React 19, TypeScript
- Tailwind CSS 4
- Supabase: Postgres, Realtime, Storage (`@supabase/supabase-js`)
- Vitest for the post rules (validation, feed ordering, time labels)
- Deployed on Vercel

## Run it locally

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor (change the project URL in the `image_url` check to yours).
2. Copy `.env.example` to `.env.local` and fill in your project URL and publishable key.
3. Then:

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build    # production build
```

## Built with AI

Built with the help of an AI coding assistant (Claude Code). I checked it by posting on the running app, refreshing to confirm posts persist, watching a second tab update live, and probing the database with the public key (over-long posts, outside image links, edits and deletes are all refused).

By Rene Vincent Cosme · [Portfolio](https://renevincentcosme.vercel.app) · [GitHub](https://github.com/RVBCosme)
