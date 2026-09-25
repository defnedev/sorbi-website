#!/bin/sh
# Deploy: önce bağlantı ve veri denetçileri, sonra yayın paketi, sonra Cloudflare Pages.
# Denetçilerden biri kırmızıysa deploy yapılmaz.
cd ~/Holding/sorbi-website-cini || exit 1
node tools/bag-denetle.mjs || { echo "bağlantı denetimi kırmızı — deploy iptal"; exit 1; }
node tools/veri-dogrula.mjs || { echo "veri denetimi kırmızı — deploy iptal"; exit 1; }
sh tools/yayin-paketle.sh || exit 1
npx --yes wrangler@4 pages deploy _yayin --project-name sorbi --branch main --commit-dirty=true 2>&1 | grep -iE "success|error|https://" | head -3
