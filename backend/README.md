# Chandrawati Bookings — Backend

Cloudflare Worker + D1 (SQLite) backing the public booking form and the
`/admin/` dashboard. Records every appointment server-side so staff have a
department-wise view independent of any individual browser's localStorage.

## Architecture

```
Patient site (GitHub Pages)
   │
   ├── POST /bookings           ──► chandrawati-bookings worker ──► D1
   └── POST /                   ──► chandrawati-email worker   ──► Brevo
                                    (already deployed, unchanged)

Admin dashboard (GitHub Pages, /admin/)
   ├── POST /admin/login
   ├── GET  /admin/bookings
   └── GET  /admin/bookings.csv ──► chandrawati-bookings worker ──► D1
```

The email worker keeps doing exactly what it did. The new worker is
additive — if it ever goes down, bookings still get a confirmation email
and a token number; only the admin record is missed.

## One-time deploy

Prereqs: `node` ≥ 18 (already installed). Wrangler is pulled via `npx`.

```bash
# From repo root
cd backend

# Log in to the same Cloudflare account that hosts the email worker.
# This opens a browser window and writes ~/.config/.wrangler/config/...
npx wrangler login

# Provision D1, apply schema, prompt for admin password, deploy worker.
./deploy.sh
```

`deploy.sh` is idempotent — re-run it any time you change the worker code
or schema. It only creates the D1 database once.

When prompted for `ADMIN_PASSWORD`, pick something long. To rotate later:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

## After deploy

1. The deploy script prints the worker URL. If your Cloudflare workers.dev
   subdomain differs from `drritikchandra`, update:
   - `BOOKINGS_API_URL` in `index.html` (top of the script block near `EMAIL_PROXY_URL`)
   - `window.BOOKINGS_API_URL` in `admin/config.js`
   - Then `git push` so GitHub Pages picks up the new values.

2. Visit `https://lordofchaos666.github.io/chandrawati-hospital-v2/admin/`
   and sign in with the admin password.

3. Smoke test: book a real appointment on the public site, refresh the
   admin dashboard, and confirm the record shows up under the right
   department.

## Local development

```bash
cd backend
npx wrangler dev           # runs worker locally on http://127.0.0.1:8787
npx wrangler d1 execute chandrawati-bookings --local --file=./schema.sql
```

Local dev uses a separate local SQLite file — no risk of touching prod data.

## Inspecting bookings from CLI

```bash
npx wrangler d1 execute chandrawati-bookings --remote \
  --command "SELECT department, COUNT(*) FROM bookings GROUP BY department;"
```

## Schema

See [`schema.sql`](./schema.sql). The `bookings` table is indexed on
`appointment_date`, `department`, `patient_phone`, and `created_at` —
covers every filter the admin dashboard supports without scanning.
