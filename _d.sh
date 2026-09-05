cd ~/Holding/sorbi-website-cini && npx --yes wrangler@4 pages deploy . --project-name sorbi --branch main --commit-dirty=true 2>&1 | tail -3
for u in sayim sayim-yukselen nadirlik ogren; do printf "/%-16s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://sorbiapp.com/$u"; done
