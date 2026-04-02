# Whispr — Anonymous Idea Board
*made by lebrondeno*

Share a link in your WhatsApp group. Members submit ideas anonymously. You see everything on the admin dashboard.

---

## Quick Setup (~10 minutes)

### 1. Supabase (free database)

1. Go to [supabase.com](https://supabase.com) → create a free account → **New project**
2. Open **SQL Editor** → paste the full contents of `supabase_setup.sql` → click **Run**
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public** key

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` — you should see the Whispr home screen.

### 4. Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Then go to your project on [vercel.com](https://vercel.com):
- **Settings → Environment Variables**
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Redeploy

Your live link will look like: `https://whispr.vercel.app`

---

## How it works

| Route | Who uses it | What it does |
|---|---|---|
| `/` | Admin | Create a session, get a shareable link |
| `/s/:id` | Members | Open link, type idea, submit anonymously |
| `/admin/:id` | Admin | View all ideas, filter, upvote, delete |

**Flow:**
1. You open the app → enter a title + categories → click **Create session**
2. You get a link like `https://yourapp.vercel.app/s/abc123`
3. Paste that link in your WhatsApp group
4. Members tap it, type their idea, hit submit — no login, no name, nothing tracked
5. You visit `/admin/:id` (bookmarked automatically after creation) to read all responses

---

## Tech stack

- **React + TypeScript + Vite** — fast, modern frontend
- **Supabase** — Postgres database, free tier
- **React Router** — client-side routing
- **Vercel** — deployment, free tier

---

*made by lebrondeno*
