CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_number INTEGER NOT NULL,
  department TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_age TEXT,
  appointment_date TEXT NOT NULL,
  slot TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_dept ON bookings(department);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(patient_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
