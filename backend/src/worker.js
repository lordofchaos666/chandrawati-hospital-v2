// Chandrawati Hospital — bookings worker
//
// Endpoints:
//   POST /bookings          Public. Records a new appointment booking.
//   POST /admin/login       Verifies the shared admin password, echoes it back as a session token.
//   GET  /admin/bookings    Lists all bookings. Requires `Authorization: Bearer <password>`.
//   GET  /admin/bookings.csv Same, but as CSV download.
//
// Bindings (set in wrangler.toml + `wrangler secret put`):
//   DB                  D1 database
//   ADMIN_PASSWORD      shared admin password (secret)
//   ALLOWED_ORIGIN      CORS origin (var, defaults to GitHub Pages site)

const REQUIRED_BOOKING_FIELDS = [
  'tokenNumber', 'department', 'patientName',
  'patientPhone', 'appointmentDate', 'slot',
];

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, init = {}, env) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
      ...(init.headers || {}),
    },
  });
}

// Constant-time string compare — avoids timing leaks on the admin password.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return false;
  return safeEqual(m[1], env.ADMIN_PASSWORD || '');
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // ── Public: record a booking ────────────────────────────────────────
    if (url.pathname === '/bookings' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, { status: 400 }, env);
      }
      for (const k of REQUIRED_BOOKING_FIELDS) {
        if (!body[k]) return json({ error: `Missing: ${k}` }, { status: 400 }, env);
      }
      try {
        const result = await env.DB.prepare(
          `INSERT INTO bookings
             (token_number, department, patient_name, patient_phone, patient_email, patient_age, appointment_date, slot, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          Number(body.tokenNumber),
          body.department,
          body.patientName,
          body.patientPhone,
          body.patientEmail || null,
          body.patientAge || null,
          body.appointmentDate,
          body.slot,
          body.notes || null,
        ).run();
        return json({ ok: true, id: result.meta?.last_row_id ?? null }, { status: 201 }, env);
      } catch (e) {
        return json({ error: 'DB write failed', detail: String(e) }, { status: 500 }, env);
      }
    }

    // ── Admin login ─────────────────────────────────────────────────────
    if (url.pathname === '/admin/login' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { body = {}; }
      if (!safeEqual(body.password || '', env.ADMIN_PASSWORD || '')) {
        return json({ error: 'Invalid password' }, { status: 401 }, env);
      }
      // The "token" the dashboard stores is just the password — the worker
      // never trusts the client-side token alone; it re-checks on every request.
      return json({ ok: true, token: env.ADMIN_PASSWORD }, {}, env);
    }

    // ── Admin: list bookings ────────────────────────────────────────────
    if (url.pathname === '/admin/bookings' && request.method === 'GET') {
      if (!requireAdmin(request, env)) {
        return json({ error: 'Unauthorized' }, { status: 401 }, env);
      }
      const { results } = await env.DB.prepare(
        `SELECT id, token_number, department, patient_name, patient_phone,
                patient_email, patient_age, appointment_date, slot, notes, created_at
         FROM bookings
         ORDER BY appointment_date DESC, id DESC`
      ).all();
      return json({ bookings: results }, {}, env);
    }

    // ── Admin: CSV export ───────────────────────────────────────────────
    if (url.pathname === '/admin/bookings.csv' && request.method === 'GET') {
      if (!requireAdmin(request, env)) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders(env) });
      }
      const { results } = await env.DB.prepare(
        `SELECT token_number, department, appointment_date, slot,
                patient_name, patient_phone, patient_email, patient_age,
                notes, created_at
         FROM bookings
         ORDER BY appointment_date DESC, id DESC`
      ).all();
      const header = ['Token','Department','Date','Slot','Name','Phone','Email','Age','Notes','Booked At'];
      const lines = [header.join(',')];
      for (const r of results) {
        lines.push([
          r.token_number, r.department, r.appointment_date, r.slot,
          r.patient_name, r.patient_phone, r.patient_email,
          r.patient_age, r.notes, r.created_at,
        ].map(csvEscape).join(','));
      }
      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="bookings.csv"',
          ...corsHeaders(env),
        },
      });
    }

    return json({ error: 'Not found' }, { status: 404 }, env);
  },
};
