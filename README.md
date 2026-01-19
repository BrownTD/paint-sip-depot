# Paint & Sip Depot

A production-ready MVP platform for hosting paint & sip events. Hosts can create events, sell tickets via Stripe, and manage their guest lists.

## 🎨 Features

### For Hosts
- **Event Management**: Create, publish, and manage paint & sip events
- **Canvas Catalog**: Browse pre-loaded canvas templates or upload custom images
- **Ticket Sales**: Integrated Stripe Checkout for secure payments
- **Guest Tracking**: View attendees and booking details
- **Calendar View**: Visual calendar of all scheduled events
- **Revenue Dashboard**: Track sales and revenue

### For Guests
- **Event Discovery**: Browse upcoming events with rich details
- **Easy Booking**: Select tickets and checkout via Stripe
- **Event Details**: View canvas preview, location, timing, and policies

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Neon/Supabase compatible)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **Payments**: Stripe Checkout
- **Storage**: Vercel Blob
- **Hosting**: Vercel

## 📁 Project Structure

```
paint-sip-depot/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login/Signup pages
│   │   ├── (dashboard)/     # Protected host dashboard
│   │   │   └── dashboard/
│   │   │       ├── events/  # Event management
│   │   │       ├── bookings/# Booking list
│   │   │       ├── calendar/# Calendar view
│   │   │       └── canvases/# Canvas catalog
│   │   ├── (public)/        # Public pages
│   │   │   ├── e/[slug]/    # Event booking page
│   │   │   ├── events/      # Event listing
│   │   │   └── booking/     # Booking success
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Auth endpoints
│   │   │   ├── events/      # Event CRUD
│   │   │   ├── canvases/    # Canvas management
│   │   │   ├── checkout/    # Stripe checkout
│   │   │   ├── upload/      # Image uploads
│   │   │   └── webhooks/    # Stripe webhooks
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma client
│   │   ├── stripe.ts        # Stripe client
│   │   ├── utils.ts         # Utilities
│   │   └── validations.ts   # Zod schemas
│   └── types/
│       └── next-auth.d.ts   # Type extensions
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (Neon, Supabase, or local)
- Stripe account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <repo-url>
cd paint-sip-depot
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/paint_sip_depot?sslmode=require"

# NextAuth
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

Push the schema to your database:

```bash
pnpm db:push
```

Or use migrations for production:

```bash
pnpm db:migrate
```

Seed initial data:

```bash
pnpm db:seed
```

### 4. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard > Developers > API keys
3. Set up the webhook:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding:
- **Host**: demo@paintsip.com / demo123
- **Admin**: admin@paintsip.com / admin123

## 🌐 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables in Settings > Environment Variables
4. Deploy!

### 3. Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
2. Update Stripe webhook endpoint to production URL
3. Update `AUTH_URL` to production URL

## 📋 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret key | Yes |
| `AUTH_URL` | App URL for auth callbacks | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | Yes (for uploads) |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |

## 🔄 Database Schema

### Core Models

- **User**: Host accounts with email/password auth
- **Event**: Paint & sip events with all details
- **Booking**: Ticket purchases linked to Stripe
- **Canvas**: Reusable canvas templates

### Key Relationships

```
User (Host) ─┬─ Event ─── Booking
             │    │
             │    └── Canvas (optional)
             │
             └── Account (OAuth - future)
```

## 💳 Payment Flow

1. Guest selects tickets and enters info
2. Server creates pending Booking
3. Server creates Stripe Checkout Session
4. Guest redirects to Stripe
5. After payment, Stripe webhook fires
6. Webhook updates Booking to PAID
7. Guest sees success page

## 🛡 Security Features

- Server-side authentication checks
- Zod validation on all inputs
- Stripe webhook signature verification
- Protected API routes
- Host ownership verification
- Sales cutoff enforcement
- Capacity checks

## 🔮 Future Enhancements

- [ ] Stripe Connect for host payouts
- [ ] Email notifications (SendGrid/Resend)
- [ ] Event reminders
- [ ] Admin refund interface
- [ ] Guest check-in system
- [ ] Review/rating system
- [ ] Social sharing
- [ ] Multiple ticket types
- [ ] Promo codes

## 📄 License

MIT
