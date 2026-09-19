#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sitemap.xml icindeki <lastmod> degerlerini git gecmisinden tazeler.

Neden: 19 Eylul 2026 denetiminde 56 URL'nin 44'u hala 2026-08-03 tarihini
tasiyordu, oysa sayfalarin bir kismi o gun degismisti. Elle guncellenen bir
alan er gec bayatliyor; kaynak git olmali. Deploy oncesi calistir.
"""
import re, subprocess, sys, os, datetime

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SM  = os.path.join(KOK, 'sitemap.xml')

def dosya(slug):
    slug = slug.rstrip('/')
    return 'index.html' if slug in ('', '/') else slug.lstrip('/') + '.html'

TOPLU_ESIK = 20   # bir commit bu kadar dosyaya dokunduysa "toplu tarama" sayilir

def _toplu_commitler():
    """Footer/nav/isim taramasi gibi tum siteye dokunan commit'lerin kumesi.

    Bunlari lastmod kaynagi saymiyoruz: bir footer degisikligi 61 sayfanin
    hepsine "bugun guncellendi" dedirtir, sitemap'in tamami ayni tarihi
    gosterir ve Google boyle bir lastmod'u dikkate almayi birakir.
    """
    out = subprocess.check_output(
        ['git', '-C', KOK, 'log', '--format=%H', '--name-only'],
        stderr=subprocess.DEVNULL).decode()
    kume, h, n = set(), None, 0
    for satir in out.split('\n'):
        if not satir.strip():
            continue
        if len(satir) == 40 and all(c in '0123456789abcdef' for c in satir):
            if h and n > TOPLU_ESIK:
                kume.add(h)
            h, n = satir, 0
        else:
            n += 1
    if h and n > TOPLU_ESIK:
        kume.add(h)
    return kume

TOPLU = None

def git_tarih(f):
    global TOPLU
    if TOPLU is None:
        TOPLU = _toplu_commitler()
    if not os.path.exists(os.path.join(KOK, f)):
        return None
    try:
        out = subprocess.check_output(
            ['git', '-C', KOK, 'log', '--format=%H %ad', '--date=short', '--', f],
            stderr=subprocess.DEVNULL).decode().strip()
    except subprocess.CalledProcessError:
        return None
    if not out:
        return None
    satirlar = [x for x in out.split('\n') if x.strip()]
    for satir in satirlar:                      # en yeniden eskiye
        h, t = satir[:40], satir[41:]
        if h not in TOPLU:
            return t                            # ilk "gercek" degisiklik
    return satirlar[-1][41:]                    # hepsi topluysa: ilk yayin tarihi

def main():
    s = open(SM, encoding='utf-8').read()
    degisen, atlanan, eksik = 0, 0, []

    def url_blok(m):
        nonlocal degisen, atlanan
        blok = m.group(0)
        loc = re.search(r'<loc>(.*?)</loc>', blok)
        if not loc:
            return blok
        slug = loc.group(1).replace('https://sorbiapp.com', '')
        f = dosya(slug)
        t = git_tarih(f)
        if not t:
            eksik.append(slug or '/')
            return blok
        yeni, n = re.subn(r'<lastmod>[^<]*</lastmod>', '<lastmod>%s</lastmod>' % t, blok)
        if n == 0:
            yeni = blok.replace('</loc>', '</loc>\n    <lastmod>%s</lastmod>' % t)
        if yeni != blok:
            degisen += 1
        else:
            atlanan += 1
        return yeni

    yeni = re.sub(r'<url>.*?</url>', url_blok, s, flags=re.S)
    if yeni != s:
        open(SM, 'w', encoding='utf-8').write(yeni)
    print('lastmod guncellendi: %d · zaten dogru: %d' % (degisen, atlanan))
    if eksik:
        print('git tarihi bulunamadi (%d): %s' % (len(eksik), ', '.join(eksik[:10])))
    return 0

if __name__ == '__main__':
    sys.exit(main())
