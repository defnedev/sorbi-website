const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'sorbi.db'));

// WAL modu — performans
db.pragma('journal_mode = WAL');

// ── Tablolar ────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS availability_template (
    day_of_week INTEGER PRIMARY KEY,
    enabled     INTEGER DEFAULT 0,
    slots       TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS availability_overrides (
    date    TEXT PRIMARY KEY,
    enabled INTEGER,
    slots   TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    service    TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    email      TEXT,
    date       TEXT    NOT NULL,
    time       TEXT    NOT NULL,
    notes      TEXT,
    status     TEXT    DEFAULT 'pending',
    created_at TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );
`);

// ── Varsayılan müsaitlik şablonu ────────────────────────────────────────────
// Salı & Perşembe 10:00–18:00, Cuma 10:00–14:30 (90dk bloklar)

const defaultTemplate = [
  { day: 0, enabled: 0, slots: [] },                                             // Pazar
  { day: 1, enabled: 0, slots: [] },                                             // Pazartesi
  { day: 2, enabled: 1, slots: ['10:00','11:30','13:00','14:30','16:00','17:30'] }, // Salı
  { day: 3, enabled: 0, slots: [] },                                             // Çarşamba
  { day: 4, enabled: 1, slots: ['10:00','11:30','13:00','14:30','16:00','17:30'] }, // Perşembe
  { day: 5, enabled: 1, slots: ['10:00','11:30','13:00','14:30'] },              // Cuma
  { day: 6, enabled: 0, slots: [] },                                             // Cumartesi
];

const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO availability_template (day_of_week, enabled, slots)
  VALUES (@day, @enabled, @slots)
`);

const seedTemplates = db.transaction(() => {
  for (const t of defaultTemplate) {
    insertTemplate.run({ day: t.day, enabled: t.enabled, slots: JSON.stringify(t.slots) });
  }
});
seedTemplates();

// ── Sorgu yardımcıları ───────────────────────────────────────────────────────

const helpers = {
  // Bir günün template + override'dan müsait slotlarını döndürür
  getAvailableSlots(dateStr) {
    const d      = new Date(dateStr + 'T12:00:00Z');
    const dow    = d.getUTCDay();
    const tmpl   = db.prepare('SELECT * FROM availability_template WHERE day_of_week = ?').get(dow);
    const over   = db.prepare('SELECT * FROM availability_overrides WHERE date = ?').get(dateStr);

    let enabled, slots;

    if (over) {
      enabled = over.enabled === 1;
      slots   = over.slots ? JSON.parse(over.slots) : (tmpl ? JSON.parse(tmpl.slots) : []);
    } else {
      enabled = tmpl ? tmpl.enabled === 1 : false;
      slots   = tmpl ? JSON.parse(tmpl.slots) : [];
    }

    if (!enabled) return [];

    // Onaylı randevuları çıkar
    const booked = db.prepare(
      "SELECT time FROM bookings WHERE date = ? AND status IN ('approved','pending')"
    ).all(dateStr).map(r => r.time);

    return slots.filter(s => !booked.includes(s));
  },

  // Ayın tüm günleri için müsait slot sayısını döndürür
  getMonthAvailability(year, month) {
    const result = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      result[dateStr] = helpers.getAvailableSlots(dateStr).length;
    }
    return result;
  },

  getAllTemplate() {
    return db.prepare('SELECT * FROM availability_template ORDER BY day_of_week').all()
      .map(r => ({ ...r, slots: JSON.parse(r.slots), enabled: r.enabled === 1 }));
  },

  updateTemplate(day, enabled, slots) {
    db.prepare('UPDATE availability_template SET enabled=?, slots=? WHERE day_of_week=?')
      .run(enabled ? 1 : 0, JSON.stringify(slots), day);
  },

  setOverride(date, enabled, slots) {
    if (enabled === null) {
      db.prepare('DELETE FROM availability_overrides WHERE date=?').run(date);
    } else {
      db.prepare('INSERT OR REPLACE INTO availability_overrides (date,enabled,slots) VALUES (?,?,?)')
        .run(date, enabled ? 1 : 0, slots ? JSON.stringify(slots) : null);
    }
  },

  getOverridesForMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return db.prepare("SELECT * FROM availability_overrides WHERE date LIKE ?").all(prefix + '%')
      .map(r => ({ ...r, slots: r.slots ? JSON.parse(r.slots) : null, enabled: r.enabled === 1 }));
  },

  createBooking(data) {
    const stmt = db.prepare(`
      INSERT INTO bookings (service, name, phone, email, date, time, notes)
      VALUES (@service, @name, @phone, @email, @date, @time, @notes)
    `);
    const info = stmt.run(data);
    return db.prepare('SELECT * FROM bookings WHERE id=?').get(info.lastInsertRowid);
  },

  getBooking(id) {
    return db.prepare('SELECT * FROM bookings WHERE id=?').get(id);
  },

  updateBookingStatus(id, status) {
    db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status, id);
    return db.prepare('SELECT * FROM bookings WHERE id=?').get(id);
  },

  getPendingBookings() {
    return db.prepare("SELECT * FROM bookings WHERE status='pending' ORDER BY date, time").all();
  },

  getAllBookings(limit = 200) {
    return db.prepare("SELECT * FROM bookings ORDER BY date DESC, time DESC LIMIT ?").all(limit);
  },

  getBookingsForDate(dateStr) {
    return db.prepare("SELECT * FROM bookings WHERE date=? ORDER BY time").all(dateStr);
  },

  // Belirli bir tarih+saat kombinasyonu zaten alınmış mı?
  isSlotTaken(date, time) {
    const r = db.prepare(
      "SELECT id FROM bookings WHERE date=? AND time=? AND status IN ('pending','approved')"
    ).get(date, time);
    return !!r;
  },

  getStats() {
    const total    = db.prepare("SELECT COUNT(*) as c FROM bookings").get().c;
    const pending  = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='pending'").get().c;
    const approved = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='approved'").get().c;
    const rejected = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='rejected'").get().c;
    return { total, pending, approved, rejected };
  }
};

module.exports = { db, helpers };
