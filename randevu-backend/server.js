require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const jwt       = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { helpers } = require('./db');
const { calculateNatal } = require('./natal');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Email ────────────────────────────────────────────────────────────────────

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    await mailer.sendMail({ from: `"Sorbi ✦" <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (e) {
    console.error('Email gönderilemedi:', e.message);
  }
}

const SERVICES = {
  'natal-harita'   : 'Natal Harita',
  'sinastri'       : 'Sinastri',
  'tarot'          : 'Tarot Açılımı',
  'horary'         : 'Horary',
  'yasam-donguleri': 'Yaşam Döngüleri',
  'sorbi-ongorisu' : 'Sorbi Öngörüsü',
};

const TR_DAYS = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${d.getUTCDate()} ${TR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${TR_DAYS[d.getUTCDay()]}`;
}

// Defne'ye bildirim emaili
async function notifyDefne(booking) {
  const serviceName = SERVICES[booking.service] || booking.service;
  const adminUrl    = process.env.ADMIN_URL || 'admin/randevu-admin.html';
  const waLink      = `https://wa.me/${process.env.WA_NUMBER || '905434309702'}?text=${encodeURIComponent(
    `Merhaba ${booking.name}! Randevu talebinizi onayladım. ${formatDate(booking.date)} saat ${booking.time}'de görüşmek üzere.`
  )}`;

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0A0E1A;color:#f4f0e4;padding:2rem;border-radius:12px;">
    <h2 style="color:#C9A84C;font-size:1.5rem;margin-bottom:1rem;">✦ Yeni Randevu Talebi</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);width:130px;">Hizmet</td><td style="color:#E6CF8A;font-weight:600;">${serviceName}</td></tr>
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);">Tarih</td><td>${formatDate(booking.date)}</td></tr>
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);">Saat</td><td>${booking.time}</td></tr>
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);">Ad Soyad</td><td>${booking.name}</td></tr>
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);">Telefon</td><td>${booking.phone}</td></tr>
      <tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);">Email</td><td>${booking.email || '—'}</td></tr>
      ${booking.notes ? `<tr><td style="padding:0.4rem 0;color:rgba(244,240,228,0.5);vertical-align:top;">Not</td><td style="font-style:italic;">"${booking.notes}"</td></tr>` : ''}
    </table>
    <div style="margin-top:1.5rem;display:flex;gap:0.8rem;flex-wrap:wrap;">
      <a href="${adminUrl}#booking-${booking.id}" style="background:#C9A84C;color:#0A0E1A;padding:0.6rem 1.4rem;border-radius:999px;text-decoration:none;font-weight:600;font-size:0.85rem;">Admin Paneli Aç</a>
      <a href="${waLink}" style="background:#25D366;color:#fff;padding:0.6rem 1.4rem;border-radius:999px;text-decoration:none;font-weight:600;font-size:0.85rem;">WhatsApp'tan Onayla</a>
    </div>
    <p style="margin-top:1.5rem;font-size:0.78rem;color:rgba(244,240,228,0.3);">Randevu ID: #${booking.id} — Sorbi Randevu Sistemi</p>
  </div>`;

  await sendEmail(process.env.EMAIL_TO, `✦ Yeni Randevu Talebi — ${serviceName} / ${formatDate(booking.date)} ${booking.time}`, html);
}

// Danışana onay emaili
async function notifyCustomer(booking) {
  if (!booking.email) return;
  const serviceName = SERVICES[booking.service] || booking.service;
  const waLink = `https://wa.me/${process.env.WA_NUMBER || '905434309702'}?text=${encodeURIComponent(
    `Merhaba Defne! ${formatDate(booking.date)} ${booking.time} randevumu onayladığın için teşekkürler.`
  )}`;

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0A0E1A;color:#f4f0e4;padding:2rem;border-radius:12px;">
    <h2 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem;">✦ Randevunuz Onaylandı</h2>
    <p style="color:rgba(244,240,228,0.6);margin-bottom:1.5rem;font-size:0.9rem;">Merhaba ${booking.name}, randevu talebiniz Defne tarafından onaylandı.</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.22);border-radius:10px;padding:1.2rem;margin-bottom:1.5rem;">
      <p style="margin:0 0 0.4rem;font-size:0.82rem;color:rgba(244,240,228,0.5);">HİZMET</p>
      <p style="margin:0 0 1rem;color:#E6CF8A;font-weight:600;">${serviceName}</p>
      <p style="margin:0 0 0.4rem;font-size:0.82rem;color:rgba(244,240,228,0.5);">TARİH & SAAT</p>
      <p style="margin:0;font-size:1.1rem;color:#f4f0e4;">${formatDate(booking.date)} — ${booking.time}</p>
    </div>
    <a href="${waLink}" style="background:#25D366;color:#fff;padding:0.7rem 1.6rem;border-radius:999px;text-decoration:none;font-weight:600;font-size:0.88rem;display:inline-block;">WhatsApp ile Ulaş</a>
    <p style="margin-top:1.5rem;font-size:0.78rem;color:rgba(244,240,228,0.3);">Sorbi Astroloji Danışmanlığı</p>
  </div>`;

  await sendEmail(booking.email, `✦ Randevunuz Onaylandı — ${formatDate(booking.date)} ${booking.time}`, html);
}

// ── JWT Auth middleware ───────────────────────────────────────────────────────

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'sorbi-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Token geçersiz' });
  }
}

// ── Public Routes ─────────────────────────────────────────────────────────────

// Aylık müsaitlik haritası
app.get('/api/slots', (req, res) => {
  const year  = parseInt(req.query.year  || new Date().getFullYear());
  const month = parseInt(req.query.month || new Date().getMonth() + 1);
  if (isNaN(year) || isNaN(month)) return res.status(400).json({ error: 'Geçersiz tarih' });
  res.json(helpers.getMonthAvailability(year, month));
});

// Belirli günün slotları
app.get('/api/slots/:date', (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Geçersiz tarih formatı' });
  res.json({ date, slots: helpers.getAvailableSlots(date) });
});

// Randevu oluştur
app.post('/api/bookings', (req, res) => {
  const { service, name, phone, email, date, time, notes } = req.body;

  if (!service || !name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Eksik alan: service, name, phone, date, time zorunlu' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Geçersiz tarih' });
  if (helpers.isSlotTaken(date, time)) {
    return res.status(409).json({ error: 'Bu saat dolu, lütfen başka bir saat seçin' });
  }

  const available = helpers.getAvailableSlots(date);
  if (!available.includes(time)) {
    return res.status(409).json({ error: 'Bu saat müsait değil' });
  }

  try {
    const booking = helpers.createBooking({ service, name, phone: phone.trim(), email: email?.trim() || null, date, time, notes: notes?.trim() || null });
    notifyDefne(booking).catch(console.error);
    res.status(201).json({ success: true, bookingId: booking.id, message: 'Randevu talebiniz alındı. Defne onayladıktan sonra bildirim alacaksınız.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Randevu oluşturulamadı' });
  }
});

// Randevu durumu sorgula (danışan tarafı)
app.get('/api/bookings/:id', (req, res) => {
  const booking = helpers.getBooking(parseInt(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Randevu bulunamadı' });
  // Hassas bilgileri filtrele
  const { id, service, name, date, time, status, created_at } = booking;
  res.json({ id, service, name, date, time, status, created_at });
});

// ── Admin Routes ──────────────────────────────────────────────────────────────

// Giriş
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || 'sorbi2026')) {
    return res.status(401).json({ error: 'Yanlış şifre' });
  }
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'sorbi-secret', { expiresIn: '12h' });
  res.json({ token });
});

// İstatistikler
app.get('/api/admin/stats', adminAuth, (req, res) => {
  res.json(helpers.getStats());
});

// Tüm randevular
app.get('/api/admin/bookings', adminAuth, (req, res) => {
  res.json(helpers.getAllBookings());
});

// Bekleyen randevular
app.get('/api/admin/bookings/pending', adminAuth, (req, res) => {
  res.json(helpers.getPendingBookings());
});

// Belirli günün randevuları
app.get('/api/admin/bookings/date/:date', adminAuth, (req, res) => {
  res.json(helpers.getBookingsForDate(req.params.date));
});

// Onayla
app.post('/api/admin/bookings/:id/approve', adminAuth, (req, res) => {
  const booking = helpers.getBooking(parseInt(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Randevu bulunamadı' });
  if (booking.status !== 'pending') return res.status(400).json({ error: 'Bu randevu zaten işlendi' });

  const updated = helpers.updateBookingStatus(booking.id, 'approved');
  notifyCustomer(updated).catch(console.error);
  res.json({ success: true, booking: updated });
});

// Reddet
app.post('/api/admin/bookings/:id/reject', adminAuth, (req, res) => {
  const booking = helpers.getBooking(parseInt(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Randevu bulunamadı' });
  if (booking.status !== 'pending') return res.status(400).json({ error: 'Bu randevu zaten işlendi' });

  const updated = helpers.updateBookingStatus(booking.id, 'rejected');
  res.json({ success: true, booking: updated });
});

// Müsaitlik şablonu al
app.get('/api/admin/availability/template', adminAuth, (req, res) => {
  res.json(helpers.getAllTemplate());
});

// Müsaitlik şablonu güncelle
app.put('/api/admin/availability/template', adminAuth, (req, res) => {
  const { day, enabled, slots } = req.body;
  if (day === undefined || !Array.isArray(slots)) return res.status(400).json({ error: 'Eksik alan' });
  helpers.updateTemplate(day, enabled, slots);
  res.json({ success: true });
});

// Override al (ay)
app.get('/api/admin/availability/overrides', adminAuth, (req, res) => {
  const year  = parseInt(req.query.year  || new Date().getFullYear());
  const month = parseInt(req.query.month || new Date().getMonth() + 1);
  res.json(helpers.getOverridesForMonth(year, month));
});

// Override ekle/sil
app.put('/api/admin/availability/overrides/:date', adminAuth, (req, res) => {
  const { date } = req.params;
  const { enabled, slots, remove } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Geçersiz tarih' });
  helpers.setOverride(date, remove ? null : enabled, remove ? null : slots);
  res.json({ success: true });
});

// ── Doğum Haritası (Jean Meeus) ───────────────────────────────────────────────

app.post('/natal-chart', (req, res) => {
  try {
    const { year, month, day, hour, minute, lat, lng, tzOffset } = req.body;

    if ([year, month, day, hour, minute, lat, lng].some(v => v === undefined || v === null)) {
      return res.status(400).json({ error: 'Eksik parametre: year, month, day, hour, minute, lat, lng gerekli.' });
    }

    const result = calculateNatal({
      year: +year, month: +month, day: +day,
      hour: +hour, minute: +minute,
      lat: +lat, lng: +lng,
      tzOffset: tzOffset !== undefined ? +tzOffset : undefined
    });

    // index.html fetchNatal() fonksiyonunun beklediği format
    res.json({
      data: {
        planets: [
          { name: 'sun',  sign: result.sun.sign,  longitude: result.sun.longitude  },
          { name: 'moon', sign: result.moon.sign, longitude: result.moon.longitude },
        ],
        angles: {
          ascendant: { sign: result.asc.sign, longitude: result.asc.longitude }
        },
        meta: result.meta
      }
    });
  } catch (err) {
    console.error('[natal-chart]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Başlat ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✦ Sorbi Randevu Backend — http://localhost:${PORT}`);
  console.log(`  Admin şifresi: ${process.env.ADMIN_PASSWORD || 'sorbi2026'}`);
});
