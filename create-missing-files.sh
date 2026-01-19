set -euo pipefail

mkdir -p \
  src/app/\(auth\)/login \
  src/app/\(auth\)/signup \
  src/app/\(dashboard\)/dashboard/bookings \
  src/app/\(dashboard\)/dashboard/calendar \
  src/app/\(dashboard\)/dashboard/canvases \
  src/app/\(dashboard\)/dashboard/events/new \
  src/app/\(dashboard\)/dashboard/events/\[eventId\] \
  src/app/\(public\)/e/\[slug\] \
  src/app/\(public\)/events \
  src/app/\(public\)/booking/success \
  src/app/api/auth/\[...nextauth\] \
  src/app/api/auth/signup \
  src/app/api/events/calendar \
  src/app/api/events/\[eventId\] \
  src/app/api/canvases/import \
  src/app/api/checkout \
  src/app/api/upload \
  src/app/api/webhooks/stripe \
  src/components/ui \
  prisma

touch \
  .env.example .gitignore next.config.js postcss.config.js vercel.json \
  src/middleware.ts \
  src/app/globals.css src/app/layout.tsx src/app/page.tsx \
  src/app/\(auth\)/login/page.tsx \
  src/app/\(auth\)/signup/page.tsx \
  src/app/\(dashboard\)/layout.tsx \
  src/app/\(dashboard\)/dashboard/page.tsx \
  src/app/\(dashboard\)/dashboard/bookings/page.tsx \
  src/app/\(dashboard\)/dashboard/calendar/page.tsx \
  src/app/\(dashboard\)/dashboard/canvases/page.tsx \
  src/app/\(dashboard\)/dashboard/events/page.tsx \
  src/app/\(dashboard\)/dashboard/events/new/page.tsx \
  src/app/\(dashboard\)/dashboard/events/\[eventId\]/page.tsx \
  src/app/\(public\)/e/\[slug\]/page.tsx \
  src/app/\(public\)/events/page.tsx \
  src/app/\(public\)/booking/success/page.tsx \
  src/app/api/auth/\[...nextauth\]/route.ts \
  src/app/api/auth/signup/route.ts \
  src/app/api/events/route.ts \
  src/app/api/events/calendar/route.ts \
  src/app/api/events/\[eventId\]/route.ts \
  src/app/api/canvases/route.ts \
  src/app/api/canvases/import/route.ts \
  src/app/api/checkout/route.ts \
  src/app/api/upload/route.ts \
  src/app/api/webhooks/stripe/route.ts \
  src/components/booking-form.tsx \
  src/components/event-actions.tsx \
  src/components/sign-out-button.tsx \
  src/components/ui/badge.tsx \
  src/components/ui/button.tsx \
  src/components/ui/card.tsx \
  src/components/ui/dialog.tsx \
  src/components/ui/dropdown-menu.tsx \
  src/components/ui/input.tsx \
  src/components/ui/label.tsx \
  src/components/ui/select.tsx \
  src/components/ui/separator.tsx \
  src/components/ui/textarea.tsx \
  src/components/ui/toast.tsx \
  src/components/ui/toaster.tsx \
  src/components/ui/use-toast.ts

echo "✅ Created missing directories + files."

bash create-missing-files.sh