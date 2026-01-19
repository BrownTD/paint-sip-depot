# create-structure.sh (you can paste directly into terminal)

set -euo pipefail

# Ensure we're in the project root by checking for package.json
if [ ! -f "package.json" ]; then
  echo "Error: run this from your paint-sip-depot project root (where package.json is)."
  exit 1
fi

# Directories
mkdir -p prisma
mkdir -p src/app/'(auth)'
mkdir -p src/app/'(dashboard)'/dashboard/{events,bookings,calendar,canvases}
mkdir -p src/app/'(public)'/e/'[slug]'
mkdir -p src/app/'(public)'/events
mkdir -p src/app/'(public)'/booking
mkdir -p src/app/api/{auth,events,canvases,checkout,upload,webhooks}
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/types

# Files (created only if missing)
touch_if_missing () {
  local f="$1"
  if [ ! -f "$f" ]; then
    touch "$f"
  fi
}

touch_if_missing "prisma/seed.ts"

touch_if_missing "src/app/globals.css"
touch_if_missing "src/app/layout.tsx"
touch_if_missing "src/app/page.tsx"

touch_if_missing "src/lib/auth.ts"
touch_if_missing "src/lib/prisma.ts"
touch_if_missing "src/lib/stripe.ts"
touch_if_missing "src/lib/utils.ts"
touch_if_missing "src/lib/validations.ts"

touch_if_missing "src/types/next-auth.d.ts"

# These are in your tree; create if they don't exist yet
touch_if_missing ".env.example"
touch_if_missing "tailwind.config.ts"
touch_if_missing "tsconfig.json"

echo "✅ Folder tree created (missing dirs/files only)."
