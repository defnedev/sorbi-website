cd ~/Holding/sorbi-website-cini && npx --yes wrangler@4 pages deploy . --project-name sorbi --branch main --commit-dirty=true 2>&1 | grep -iE "success|error" | head -2
printf "sorbi-yer.js "; curl -s -o /dev/null -w "%{http_code}\n" https://sorbiapp.com/sorbi-yer.js
