#!/usr/bin/env python3
"""Sorbi site kapisi. Tek kaynak: tools/ACIK.txt

Yaptigi:
  1. .assetsignore -> ACIK.txt'te olmayan her .html deploy disi (canlida 404)
  2. sitemap.xml   -> sadece acik + indexlenebilir sayfalar
  3. nav + footer  -> tools/nav.html / tools/footer.html sablonundan, kapali
                      hedefler elenerek acik sayfalara basilir
  4. rapor         -> acik sayfalarda kapali hedefe giden kalan linkler +
                      kapali sayfaya bakan _redirects kurallari

Kullanim: python3 tools/kapi.py [--dry]
"""
import os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
DRY = '--dry' in sys.argv

# deploy disi sabitler (sayfa listesinden bagimsiz)
BASE_IGNORE = """# Yayina cikmayacak dosyalar - tools/kapi.py tarafindan URETILIR.
# Elle duzenleme; acik sayfa listesi tools/ACIK.txt icinde.
randevu-backend
tools
_arsiv
admin
*.md
*.py
Dockerfile
node_modules
.wrangler
"""
ALWAYS_KEEP = {'404.html'}

def slug_to_file(h):
    h = h.split('#')[0].split('?')[0].rstrip('/')
    if h in ('', '/'): return 'index.html'
    if not h.startswith('/'): return None
    return h[1:] + '.html'

# --- 1. acik liste ---
acik = []
for line in open('tools/ACIK.txt', encoding='utf-8'):
    line = line.strip()
    if not line or line.startswith('#'): continue
    f = slug_to_file(line)
    if not f: continue
    if not os.path.exists(f): print(f'  ! ACIK.txt: {line} -> {f} yok, atlandi'); continue
    if f not in acik: acik.append(f)
acik_set = set(acik) | ALWAYS_KEEP

tum = sorted(x for x in os.listdir('.') if x.endswith('.html'))
kapali = [x for x in tum if x not in acik_set]

# --- 2. .assetsignore ---
out = BASE_IGNORE + '\n# --- kapali sayfalar (%d) ---\n' % len(kapali) + '\n'.join(kapali) + '\n'
if not DRY: open('.assetsignore', 'w', encoding='utf-8').write(out)

# --- 3. nav + footer render ---
def filtre(blok):
    """kapali hedefe giden <a> satirlarini at; bosalan footer sutununu at"""
    def at(m):
        h = m.group(1)
        if h.startswith('http') or h.startswith('mailto'): return m.group(0)
        f = slug_to_file(h)
        if f is None or f in acik_set: return m.group(0)
        return ''
    blok = re.sub(r'\s*<a [^>]*href="([^"]+)"[^>]*>.*?</a>', lambda m: at(m), blok, flags=re.S)
    blok = re.sub(r'\s*<div><h4>[^<]*</h4>\s*</div>', '', blok)
    return blok

nav_t  = filtre(open('tools/nav.html', encoding='utf-8').read().strip())
foot_t = filtre(open('tools/footer.html', encoding='utf-8').read().strip())

basilan = 0
render = {}
for f in acik:
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'<header class="sbnav">.*?</header>', lambda _: nav_t, s, count=1, flags=re.S)
    s = re.sub(r'<!-- SORBI-FOOTER:START -->.*?<!-- SORBI-FOOTER:END -->', lambda _: foot_t, s, count=1, flags=re.S)
    # govdedeki kapali hedefli linkleri gizle (geri acilinca otomatik kalkar)
    s = s.replace(' hidden data-kapi-gizli', '')
    def gizle(m):
        t = slug_to_file(m.group(1))
        if t and t not in acik_set and os.path.exists(t):
            return m.group(0)[:2] + ' hidden data-kapi-gizli' + m.group(0)[2:]
        return m.group(0)
    s = re.sub(r'<a [^>]*href="(/[^"]*)"[^>]*>', gizle, s)
    render[f] = s
    if s != o:
        basilan += 1
        if not DRY: open(f, 'w', encoding='utf-8').write(s)

# --- 4. sitemap ---
today = datetime.date.today().isoformat()
def prio(f):
    if f == 'index.html': return '1.0'
    if f in ('detayli-dogum-haritasi.html','dogum-haritasi-hesaplama.html','bugun.html','araclar.html','soru-sor.html'): return '0.9'
    if f.endswith('-gunluk-yorum.html'): return '0.6'
    if f.endswith('-ozellikleri.html'): return '0.7'
    return '0.8'
rows = []
for f in acik:
    s = render[f]
    m = re.search(r'<meta name="robots" content="([^"]*)"', s)
    if m and 'noindex' in m.group(1): continue
    loc = 'https://sorbiapp.com/' + ('' if f == 'index.html' else f[:-5])
    rows.append(f' <url><loc>{loc}</loc><lastmod>{today}</lastmod><priority>{prio(f)}</priority></url>')
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(rows) + '\n</urlset>\n'
if not DRY: open('sitemap.xml', 'w', encoding='utf-8').write(sm)

# --- 5. rapor ---
olu = []
for f in acik:
    s = render[f]
    for tag in re.findall(r'<a [^>]*href="/[^"]*"[^>]*>', s):
        if 'data-kapi-gizli' in tag: continue
        h = re.search(r'href="(/[^"]*)"', tag).group(1)
        t = slug_to_file(h)
        if t and t not in acik_set and os.path.exists(t) and (f, h) not in olu: olu.append((f, h))
red = [l.split()[1] for l in open('_redirects', encoding='utf-8')
       if l.startswith('/') and len(l.split()) >= 2 and l.split()[1].startswith('/')]
olu_red = sorted({t for t in red if (slug_to_file(t) or '') not in acik_set and os.path.exists(slug_to_file(t) or '')})

print(f"{'DRY ' if DRY else ''}acik: {len(acik)}  kapali: {len(kapali)}  sitemap: {len(rows)}  nav/footer basilan: {basilan}")
print('acik sayfalar:', ' '.join('/' + (x[:-5] if x != 'index.html' else '') for x in acik))
print('govdede kalan kapali link:', len(olu))
for f, h in sorted(olu): print(f'   {f} -> {h}')
print('kapali sayfaya bakan 301 hedefi:', ' '.join(olu_red) if olu_red else 'yok')
