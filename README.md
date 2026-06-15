# Briquette du Kivu

Multilingual (FR / EN / SW) website for **Briquette du Kivu** — eco-friendly briquettes made in Bukavu, DR Congo. Static front-end with a Supabase-powered blog and an auth-protected admin dashboard.

## Structure

```
.
├── index.html              # Public site
├── admin.html              # Admin dashboard (login + blog CRUD)
├── css/styles.css          # All styles
├── js/
│   ├── main.js             # Lang switcher, navbar, reveal, lightbox, form, scroll
│   ├── blog.js             # Fetches published posts → renders the blog section
│   └── admin.js            # Supabase auth + post create/update/delete + image upload
└── supabase/
    ├── supabase-config.js  # Supabase client (URL + anon key)
    └── schema.sql          # Run in Supabase SQL editor (table, RLS, storage bucket)
```

## Setup

1. **Database** — run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates the `posts` table, Row Level Security policies, and the `blog-images` storage bucket.
2. **Admin user** — Supabase dashboard → Authentication → Users → Add user (email + password).
3. **Run locally** — ES modules require HTTP, so serve the folder rather than opening the file directly:
   ```bash
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000/` and `/admin.html`.

## Deploy (Vercel)

This is a pure static site — no build step. Import the repo in Vercel and deploy with default settings (Framework preset: **Other**, no build command, output = repository root).

## Tech

- Vanilla HTML / CSS / JS (ES modules, no bundler)
- [Supabase](https://supabase.com) JS SDK v2 via CDN — Postgres, Auth, Storage

The Supabase **anon** key in `supabase/supabase-config.js` is safe to expose publicly; data is protected by Row Level Security. Never commit the `service_role` key.
