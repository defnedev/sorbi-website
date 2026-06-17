'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Sorbi — Doğum Haritası Hesaplayıcı
// Jean Meeus "Astronomical Algorithms" (2nd Ed.) uygulaması
// Doğruluk: Güneş ~0.01°, Ay ~0.3°, Yükselen ~0.5° — burç düzeyinde yeterli
// ─────────────────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const SIGN_NAMES = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
];

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function mod360(x) { return ((x % 360) + 360) % 360; }

/** Julian Day Number (UT saati ondalık) */
function julianDay(year, month, day, utHour) {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716))
       + Math.floor(30.6001 * (m + 1))
       + day + B - 1524.5 + utHour / 24;
}

/** Türkiye UTC offset (1996 öncesi DST dahil) */
function turkeyOffset(year, month, day) {
  // 2016 Eylül'den itibaren kalıcı UTC+3
  if (year > 2016 || (year === 2016 && month >= 9)) return 3;
  // Kesin yaz saati dönemleri: Nisan–Eylül → UTC+3
  if (month >= 4 && month <= 9) return 3;
  // Kesin kış: Kasım–Şubat → UTC+2
  if (month >= 11 || month <= 2) return 2;
  // Mart: yaklaşık son Pazar'a kadar UTC+2
  if (month === 3) return day >= 26 ? 3 : 2;
  // Ekim: yaklaşık son Pazar'dan itibaren UTC+2
  if (month === 10) return day >= 26 ? 2 : 3;
  return 3;
}

// ── Güneş Boylamı (Meeus Bölüm 25) ─────────────────────────────────────────
function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M  = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = M * RAD;
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           + 0.000289 * Math.sin(3 * Mr);
  // Görünür boylam (aberration + nutation dahil değil, burç hassasiyeti yeterli)
  const sunLon = mod360(L0 + C);
  const omega = mod360(125.04 - 1934.136 * T);
  return mod360(sunLon - 0.00569 - 0.00478 * Math.sin(omega * RAD));
}

// ── Ay Boylamı (Meeus Bölüm 47, Table 47.A baş terimleri) ───────────────────
function moonLongitude(jd) {
  const T  = (jd - 2451545.0) / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  const Lp = mod360(218.3164477 + 481267.88123421*T - 0.0015786*T2 + T3/538841 - T4/65194000);
  const D  = mod360(297.8501921 + 445267.1114034 *T - 0.0018819*T2 + T3/545868 - T4/113065000);
  const M  = mod360(357.5291092 +  35999.0502909 *T - 0.0001536*T2 + T3/24490000);
  const Mp = mod360(134.9633964 + 477198.8675055 *T + 0.0087414*T2 + T3/69699   - T4/14712000);
  const F  = mod360( 93.2720950 + 483202.0175233 *T - 0.0036539*T2 - T3/3526000 + T4/863310000);

  const E  = 1 - 0.002516*T - 0.0000074*T2;
  const E2 = E * E;

  // Meeus Tablo 47.A — sigma_l katsayıları (0.000001° birimi)
  const TERMS = [
  //  D    M   M'    F    E_fak    katsayı
    [ 0,   0,  1,   0,   1,      6288774],
    [ 2,   0, -1,   0,   1,      1274027],
    [ 2,   0,  0,   0,   1,       658314],
    [ 0,   0,  2,   0,   1,       213618],
    [ 0,   1,  0,   0,   E,      -185116],
    [ 0,   0,  0,   2,   1,      -114332],
    [ 2,   0, -2,   0,   1,        58793],
    [ 2,  -1, -1,   0,   E,        57066],
    [ 2,   0,  1,   0,   1,        53322],
    [ 2,  -1,  0,   0,   E,        45758],
    [ 0,   1, -1,   0,   E,       -40923],
    [ 1,   0,  0,   0,   1,       -34720],
    [ 0,   1,  1,   0,   E,       -30383],
    [ 2,   0,  0,  -2,   1,        15327],
    [ 0,   0,  1,   2,   1,       -12528],
    [ 0,   0,  1,  -2,   1,        10980],
    [ 4,   0, -1,   0,   1,        10675],
    [ 0,   0,  3,   0,   1,        10034],
    [ 4,   0, -2,   0,   1,         8548],
    [ 2,   1, -1,   0,   E,        -7888],
    [ 2,   1,  0,   0,   E,        -6766],
    [ 1,   0, -1,   0,   1,        -5163],
    [ 1,   1,  0,   0,   E,         4987],
    [ 2,  -1,  1,   0,   E,         4036],
    [ 2,   0,  2,   0,   1,         3994],
    [ 4,   0,  0,   0,   1,         3861],
    [ 2,   0, -3,   0,   1,         3665],
    [ 0,   1, -2,   0,   E,        -2689],
    [ 2,   0, -1,   2,   1,        -2602],
    [ 2,  -1, -2,   0,   E,         2390],
    [ 1,   0,  1,   0,   1,        -2348],
    [ 2,  -2,  0,   0,   1,         2236],
    [ 0,   1,  2,   0,   E,        -2120],
    [ 0,   2,  0,   0,   E2,       -2069],
    [ 2,  -2, -1,   0,   1,         2048],
    [ 2,   0,  1,  -2,   1,        -1773],
    [ 2,   0,  0,   2,   1,        -1595],
    [ 4,  -1, -1,   0,   E,         1215],
    [ 0,   0,  2,   2,   1,        -1110],
    [ 3,   0, -1,   0,   1,         -892],
    [ 2,   1,  1,   0,   E,         -810],
    [ 4,  -1, -2,   0,   E,          759],
    [ 0,   2, -1,   0,   E2,        -713],
    [ 2,   2, -1,   0,   E,         -700],
    [ 2,   1, -2,   0,   E,          691],
    [ 2,  -1,  0,  -2,   E,          596],
    [ 4,   0,  1,   0,   1,          549],
    [ 0,   0,  4,   0,   1,          537],
    [ 4,  -1,  0,   0,   E,          520],
    [ 1,   0, -2,   0,   1,         -487],
    [ 2,   1,  0,  -2,   E,         -399],
    [ 0,   0,  2,  -2,   1,         -381],
    [ 1,   1,  1,   0,   E,          351],
    [ 3,   0, -2,   0,   1,         -340],
    [ 4,   0, -3,   0,   1,          330],
    [ 2,  -1,  2,   0,   E,          327],
    [ 0,   2,  1,   0,   E2,        -323],
    [ 1,   1, -1,   0,   E,          299],
    [ 2,   0,  3,   0,   1,          294],
  ];

  const Dr = D * RAD, Mr_ = M * RAD, Mpr = Mp * RAD, Fr = F * RAD;
  let sigmaL = 0;
  for (const [d, m, mp, f, ef, coef] of TERMS) {
    sigmaL += ef * coef * Math.sin(d*Dr + m*Mr_ + mp*Mpr + f*Fr);
  }
  return mod360(Lp + sigmaL / 1e6);
}

// ── Ekliptik eğikliği (Meeus Bölüm 22) ─────────────────────────────────────
function obliquity(T) {
  return 23.4392911111
    - (46.8150  / 3600) * T
    - (0.00059  / 3600) * T * T
    + (0.001813 / 3600) * T * T * T;
}

// ── Greenwich Sidereal Time (Meeus Bölüm 12, denklem 12.4) ──────────────────
function greenwichSiderealTime(jd) {
  const T = (jd - 2451545.0) / 36525;
  return mod360(280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T
    - T * T * T / 38710000);
}

// ── Yükselen (ASC) ekliptik boylamı ─────────────────────────────────────────
// ramc=yerel yıldız zamanı (derece), lat=coğrafi enlem, eps=ekliptik eğikliği
function ascendantLongitude(ramc, lat, eps) {
  const r = ramc * RAD;
  const l = lat * RAD;
  const e = eps * RAD;
  return mod360(Math.atan2(-Math.cos(r), Math.sin(r) * Math.cos(e) + Math.tan(l) * Math.sin(e)) * DEG);
}

function signIndex(lon) { return Math.floor(lon / 30) % 12; }

// ── Ana hesaplama ─────────────────────────────────────────────────────────────
/**
 * @param {object} p
 * @param {number} p.year, p.month (1-12), p.day
 * @param {number} p.hour, p.minute  (yerel saat)
 * @param {number} p.lat             (enlem, kuzey +)
 * @param {number} p.lng             (boylam, doğu +)
 * @param {number} [p.tzOffset]      UTC farkı saat olarak (otomatik Türkiye DST)
 */
function calculateNatal({ year, month, day, hour, minute, lat, lng, tzOffset }) {
  const tz = tzOffset !== undefined ? tzOffset : turkeyOffset(year, month, day);
  let utH = hour + minute / 60 - tz;
  let d   = day;
  // Gün taşması düzelt
  if (utH < 0)  { utH += 24; d -= 1; }
  if (utH >= 24) { utH -= 24; d += 1; }

  const jd  = julianDay(year, month, d, utH);
  const T   = (jd - 2451545.0) / 36525;
  const eps = obliquity(T);

  const sunLon  = sunLongitude(jd);
  const moonLon = moonLongitude(jd);
  const gst     = greenwichSiderealTime(jd);
  const lst     = mod360(gst + lng);          // Yerel Yıldız Zamanı (derece)
  const ascLon  = ascendantLongitude(lst, lat, eps);

  return {
    sun:  { longitude: +sunLon.toFixed(4),  sign: SIGN_NAMES[signIndex(sunLon)]  },
    moon: { longitude: +moonLon.toFixed(4), sign: SIGN_NAMES[signIndex(moonLon)] },
    asc:  { longitude: +ascLon.toFixed(4),  sign: SIGN_NAMES[signIndex(ascLon)]  },
    meta: { jd: +jd.toFixed(4), T: +T.toFixed(6), tzOffset: tz }
  };
}

module.exports = { calculateNatal, SIGN_NAMES };
