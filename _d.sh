cd ~/Holding/sorbi-website-cini
npx --yes wrangler@4 d1 execute sorbi-randevu --remote --json --command "SELECT type, meta, COUNT(*) n FROM events WHERE type LIKE 'seni_taniyorum%' GROUP BY type, meta ORDER BY n DESC LIMIT 20" 2>&1 | grep -E '"(type|meta|n)"'
