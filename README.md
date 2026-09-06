# PulseIQ Watchlist

An existing Supabase project is already connected.

Generate all required tables, migrations, relationships, indexes, RLS policies and TypeScript database types inside the connected Supabase project.

Do not create a new backend provider.

Use Supabase as the source of truth.

Build a production-ready full-stack application called PulseIQ.

Tagline:

"Know what changed. Understand what matters."

PulseIQ is an intelligent market watchlist.

The goal is NOT to show stock prices.

The goal is to help users understand:

1. What changed since they last visited.

2. Why it changed.

3. What deserves attention now.

Tech Stack:

Frontend:

- React

- TypeScript

- Vite

- Tailwind

- Shadcn UI

Backend:

- Supabase

State Management:

- TanStack Query

Authentication:

- Supabase Auth

Create:

AUTH

- Sign Up

- Login

- Logout

- Protected Routes

DATABASE

profiles

- id

- email

- full_name

- created_at

watchlists

- id

- user_id

- name

- created_at

watchlist_items

- id

- watchlist_id

- ticker

- company_name

- created_at

Generate proper foreign keys.

Generate row-level security policies.

PAGES

1. Dashboard

2. Watchlists

3. Stock Detail

4. Settings

WATCHLIST FEATURES

- Create watchlist

- Rename watchlist

- Delete watchlist

- Add stock

- Remove stock

UI

Inspired by Groww + Linear.

Minimal.

Premium.

Fast.

Generate a clean folder structure.

No mock authentication.

Everything should use Supabase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://intelligent-watch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd7218b3-01bc-4f98-b645-5d7ff4bcbcea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
