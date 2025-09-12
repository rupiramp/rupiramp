# RupiRamp Waitlist (Static Site)

A simple static landing page that saves emails to **Supabase**.

## 1) Configure Supabase in `script.js`

Edit:
```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```

## 2) Create the `waitlist` table in Supabase

Run this in **SQL Editor**:

```sql
create table if not exists public.waitlist (
  id bigserial primary key,
  email text unique not null,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

-- Allow inserts from the public site; block reads
create policy "allow insert" on public.waitlist
for insert to anon with check (true);

create policy "deny select" on public.waitlist
for select using (false);
```

## 3) Upload to GitHub

- Click **Add file → Upload files**
- Drag: `index.html`, `style.css`, `script.js`, `README.md`
- Commit

Deploy on Netlify/Vercel afterward.
