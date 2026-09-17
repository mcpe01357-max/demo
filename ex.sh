
#!/usr/bin/env bash
set -Eeuo pipefail

echo "=========================================="
echo "       CryptX Vercel Error Fixer"
echo "=========================================="

ROOT="$(pwd)"

if [[ ! -f "$ROOT/package.json" ]]; then
    echo "ERROR: Run this script from the project root."
    exit 1
fi

BACKUP_DIR=".vercel-fix-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "[1/5] Creating backups..."

cp package.json "$BACKUP_DIR/package.json"

[[ -f prisma.config.ts ]] && cp prisma.config.ts "$BACKUP_DIR/prisma.config.ts"
[[ -f src/app/game/page.tsx ]] && cp src/app/game/page.tsx "$BACKUP_DIR/page.tsx"

echo "Backup directory: $BACKUP_DIR"

echo "[2/5] Removing incompatible Prisma configuration..."

# Prisma 5.22.0 does not provide prisma/config.
# Preserve the original file outside the build path.
if [[ -f prisma.config.ts ]]; then
    mv prisma.config.ts "$BACKUP_DIR/prisma.config.ts.disabled"
    echo "Moved prisma.config.ts to backup."
else
    echo "No prisma.config.ts found."
fi

echo "[3/5] Fixing package.json scripts..."

node <<'NODE'
const fs = require("fs");

const path = "package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

if (pkg.scripts?.postinstall) {
    const command = pkg.scripts.postinstall;

    if (command.includes("prisma skills sync")) {
        delete pkg.scripts.postinstall;
        console.log("Removed unsupported Prisma skills sync postinstall.");
    }
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

echo "[4/5] Fixing PlayerState type..."

python3 <<'PY'
from pathlib import Path
import re

path = Path("src/app/game/page.tsx")

if not path.exists():
    print("Game page not found. Skipping PlayerState fix.")
    raise SystemExit(0)

text = path.read_text(encoding="utf-8")

if "attemptsTotal" not in text:
    print("No attemptsTotal references found.")
    raise SystemExit(0)

# Locate PlayerState declaration.
match = re.search(
    r"(?:interface|type)\s+PlayerState\b",
    text
)

if not match:
    print("PlayerState declaration not found.")
    print("Manual inspection required.")
    raise SystemExit(0)

# Find the declaration's opening brace.
start = text.find("{", match.end())

if start == -1:
    print("Could not locate PlayerState body.")
    raise SystemExit(1)

# Basic brace matching for interface/type object.
depth = 0
end = -1

for i in range(start, len(text)):
    if text[i] == "{":
        depth += 1
    elif text[i] == "}":
        depth -= 1
        if depth == 0:
            end = i
            break

if end == -1:
    print("Could not parse PlayerState declaration.")
    raise SystemExit(1)

body = text[start:end]

if re.search(r"\battemptsTotal\s*[?:]", body):
    print("attemptsTotal already declared.")
else:
    body = body.rstrip() + "\n  attemptsTotal?: number;\n"
    text = text[:start] + body + text[end:]
    path.write_text(text, encoding="utf-8")
    print("Added optional attemptsTotal property.")

PY

echo "[5/5] Installing and testing..."

if [[ -f package-lock.json ]]; then
    npm ci
else
    npm install
fi

npx prisma generate || {
    echo "WARNING: Prisma generate failed."
    echo "Check your schema and database configuration."
}

npm run build

echo
echo "=========================================="
echo "Build completed successfully."
echo "=========================================="
echo
echo "Review the changes, then commit:"
echo
echo "git add ."
echo 'git commit -m "Fix Vercel deployment errors"'
echo "git push origin main"
