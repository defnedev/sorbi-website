-- Sorbi Randevu — D1 şeması. (Function runtime'da da otomatik oluşturur; bu dosya manuel init için.)
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  kvkk INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  source TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  date TEXT,
  meta TEXT,
  referrer TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- E-posta listesi (2026-09-04)
CREATE TABLE IF NOT EXISTS liste (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eposta TEXT NOT NULL UNIQUE,
  kaynak TEXT,
  referrer TEXT,
  ip_ozet TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
