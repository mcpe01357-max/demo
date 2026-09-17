
#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== CryptX Vercel Fix ==="

# Ensure we are in the project root
[[ -f package.json ]] || {
  echo "ERROR: package.json not found."
  exit 1
}

PAGE="src/app/game/page.tsx"

[[ -f "$PAGE" ]] || {
  echo "ERROR: $PAGE not found."
  exit 1
}

BACKUP=".vercel-fix-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP"

cp package.json "$BACKUP/"
cp "$PAGE" "$BACKUP/page.tsx"

[[ -f prisma.config.ts ]] && cp prisma.config.ts "$BACKUP/"

echo "[1/4] Removing incompatible Prisma configuration..."

if [[ -f prisma.config.ts ]]; then
  rm prisma.config.ts
  echo "Removed prisma.config.ts"
else
  echo "prisma.config.ts already absent"
fi

echo "[2/4] Updating PlayerState type..."

python3 <<'PY'
from pathlib import Path

path = Path("src/app/game/page.tsx")
text = path.read_text(encoding="utf-8")

old = """interface PlayerState {
  score: number;
  currentOrder: number;
  totalChallenges: number;
  completedCount: number;
}"""

new = """interface PlayerState {
  score: number;
  currentOrder: number;
  totalChallenges: number;
  completedCount: number;
  attemptsTotal?: number;
}"""

if old not in text:
    if "attemptsTotal?: number;" in text:
        print("PlayerState already updated.")
    else:
        raise SystemExit(
            "ERROR: Expected PlayerState definition not found. "
            "No changes made to page.tsx."
        )
else:
    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print("Added attemptsTotal to PlayerState.")

PY

echo "[3/4] Checking package.json..."

node <<'NODE'
const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (!pkg.scripts?.build?.includes("prisma generate")) {
  pkg.scripts.build = `prisma generate && ${pkg.scripts?.build || "next build"}`;
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  console.log("Updated build script.");
} else {
  console.log("Build script already contains Prisma generation.");
}
NODE

echo "[4/4] Installing dependencies and building..."

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npx prisma generate
npm run build

echo
echo "=== SUCCESS ==="
echo "Backup: $BACKUP"
echo
echo "Review and push:"
echo "git add -A"
echo 'git commit -m "Fix Vercel deployment"'
echo "git push origin main"
