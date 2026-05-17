#!/usr/bin/env bash
# One-shot deploy for the Chandrawati bookings worker.
#
# Prereq (one-time):
#   npx wrangler login            # opens browser, picks the same Cloudflare account as your email worker
#
# Then run from inside backend/:
#   ./deploy.sh
#
# Idempotent: re-running just applies any pending schema/code changes.

set -euo pipefail

cd "$(dirname "$0")"

DB_NAME="chandrawati-bookings"

# 1. Create D1 database if it doesn't exist; capture its id either way.
echo "→ Ensuring D1 database '$DB_NAME' exists…"
DB_ID="$(npx -y wrangler d1 list --json 2>/dev/null | node -e "
  let chunks=''; process.stdin.on('data',c=>chunks+=c).on('end',()=>{
    try {
      const list = JSON.parse(chunks);
      const row = list.find(d => d.name === '$DB_NAME');
      if (row) process.stdout.write(row.uuid || row.id || '');
    } catch(e) {}
  });
" || true)"

if [ -z "$DB_ID" ]; then
  echo "  …not found, creating now."
  CREATE_OUT="$(npx -y wrangler d1 create "$DB_NAME")"
  echo "$CREATE_OUT"
  DB_ID="$(echo "$CREATE_OUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)"
fi

if [ -z "$DB_ID" ]; then
  echo "ERROR: could not determine D1 database id. Run 'npx wrangler d1 list' manually." >&2
  exit 1
fi
echo "  D1 id: $DB_ID"

# 2. Write the id into wrangler.toml.
sed -i.bak "s/^database_id = .*/database_id = \"$DB_ID\"/" wrangler.toml
rm -f wrangler.toml.bak

# 3. Apply schema (idempotent — CREATE TABLE IF NOT EXISTS).
echo "→ Applying schema…"
npx -y wrangler d1 execute "$DB_NAME" --remote --file=./schema.sql

# 4. Set the admin password secret if not already set.
if ! npx -y wrangler secret list 2>/dev/null | grep -q ADMIN_PASSWORD; then
  echo "→ Setting ADMIN_PASSWORD secret (you'll be prompted)…"
  npx -y wrangler secret put ADMIN_PASSWORD
else
  echo "→ ADMIN_PASSWORD secret already set (run 'npx wrangler secret put ADMIN_PASSWORD' to rotate)."
fi

# 5. Deploy the worker.
echo "→ Deploying worker…"
npx -y wrangler deploy

echo
echo "✔ Done. Worker URL:"
echo "    https://chandrawati-bookings.<your-subdomain>.workers.dev"
echo
echo "Update admin/config.js and the BOOKINGS_API_URL constant in index.html"
echo "if your subdomain differs from the email worker's."
