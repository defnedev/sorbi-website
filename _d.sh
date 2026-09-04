cd ~/Holding/sorbi-website-cini
npx --yes wrangler@4 d1 execute sorbi-randevu --remote --command "CREATE TABLE IF NOT EXISTS liste (id INTEGER PRIMARY KEY AUTOINCREMENT, eposta TEXT NOT NULL UNIQUE, kaynak TEXT, referrer TEXT, ip_ozet TEXT, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')))" 2>&1 | tail -3
npx --yes wrangler@4 pages deploy . --project-name sorbi --branch main --commit-dirty=true 2>&1 | tail -4
