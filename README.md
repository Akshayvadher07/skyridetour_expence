# SkyRideTour Travel & Expense Management

Travel fleet, trip, payment, invoice, and expense management built with Next.js, Prisma, and MongoDB.

---

## 🎨 Design & Branding System
The application is built on a custom design system tailored for industrial logistics:
- **Primary Theme colors:** Industrial Dark Slate Blue (`#104f9e` to `#0b3a77`) and high-contrast Logistics Safety Orange (`#f25c05`).
- **Canvas / Background:** Smooth neutral off-white (`#f4f6fa`).
- **Cards & Data Tables:** Crisp white borders (`border-slate-100`) and soft ambient shadows (`shadow-premium`).
- **UI Components:** Styled with Shadcn/ui & Tailwind CSS v4 featuring responsive modern icons and micro-animations.

---

## 🚀 Key Features

### 1. Multi-Tenant Role-based Layouts
Seamless workspaces customized for:
- **System Admins:** Manage user approval queues, verify newly registered warehouses, and track master transaction logs.
- **Warehouse Owners:** Monitor live capacity, approve/reject logistics handshakes, and manage ongoing operations.
- **Clients:** Book storage space, track transaction history, and receive status updates.

### 2. Transactional Capacity Management
- **Automatic Reclaiming:** A secure transaction check monitors when booking `endDate` parameters elapse. Owners are prompted to mark old bookings as **Completed** or **Still Ongoing**.
- **Data Integrity:** Marks bookings completed and increments available capacity back to the warehouse atomically using transactional locks (`prisma.$transaction`).
- **Edge-Case Guardrails:** Prevents dashboard popup spamming by tracking acknowledgement states (`completionAcknowledged`).

### 3. Integrated Client Notifications
- Real-time notification database writes link completion events directly to clients.
- Clean notification logs keep users updated on their booking status.

---

## 🛠️ Technology Stack
- **Framework:** [Next.js 16 (Turbopack Enabled)](https://nextjs.org/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database Engine:** MongoDB
- **Styling:** Tailwind CSS v4 & PostCSS
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)

---

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.x or above recommended).

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Database Setup
Run MongoDB locally as a replica set (Prisma's MongoDB connector requires transaction support), then generate the Prisma Client and sync the schema. MongoDB Atlas clusters already provide replica-set support:
```bash
# Push schema updates to the `skyridetour` database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Vercel Deployment

The local connection string `mongodb://localhost:27017/skyridetour` is only reachable from your development machine. Vercel cannot connect to your computer's localhost. Create a hosted MongoDB database (such as MongoDB Atlas), allow Vercel's outbound connections according to your provider's network policy, and set these Vercel project environment variables for Production (and Preview if needed):

- `DATABASE_URL`: the hosted MongoDB connection string, including the `skyridetour` database name
- `NEXTAUTH_SECRET`: a unique, random secret of at least 32 characters
- `NEXTAUTH_URL`: your deployed application URL

The `postinstall` script generates Prisma Client during Vercel's install/build. Apply schema changes to the hosted database with `npx prisma db push` from a trusted environment using the production `DATABASE_URL`; do not run the seed script against production because it clears existing records.

## Authentication

Visitors can sign in at `/login` or create an account at `/signup`. Public registration validates name, email, phone, and password on the server, stores a bcrypt hash, and always assigns the `CLIENT` role. It does not accept a role from the request. Existing `ADMIN`, `OWNER`, and `MANAGER` accounts are preserved. CLIENT sessions are limited to `/client/dashboard`, which lists only trips associated with the account email or phone; management routes remain available to the existing management roles.

Login and registration attempts are rate-limited using hashed IP/email keys in an automatically TTL-cleaned `auth_rate_limits` MongoDB collection. After deploying schema changes, sync the production schema before enabling registration:

```bash
npx prisma db push
```

Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in Vercel for each environment where the application runs. If using the one-time OWNER initializer, also set its `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, and `OWNER_INIT_TOKEN` only until the initial owner is created. Never expose these values as `NEXT_PUBLIC_*` variables.

### Initial Owner Account

Set `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, and `OWNER_INIT_TOKEN` in the Vercel project environment variables. Use a strong owner password and generate a separate random initialization token of at least 32 characters. After deploying, call the setup endpoint once from a trusted terminal:

```bash
curl --request POST "$VERCEL_URL/api/setup/owner" \
	--header "Authorization: Bearer $OWNER_INIT_TOKEN"
```

The endpoint stores only a bcrypt password hash and returns `already_initialized` on subsequent calls. It does not return the configured email or password. After successful initialization, remove `OWNER_INIT_TOKEN` and `SEED_OWNER_PASSWORD` from Vercel and redeploy; the owner can continue signing in with the created account.

---

## 📁 Project Structure
```text
├── prisma/               # Prisma schema and MongoDB setup
├── src/
│   ├── app/              # Next.js App Router (pages & layouts)
│   │   ├── admin/        # Admin portal
│   │   ├── auth/         # Login, signin, and signup setup
│   │   ├── dashboard/    # Client & Warehouse dashboards
│   │   └── globals.css   # Main stylesheet & custom Tailwind configuration
│   ├── components/       # Reusable React components (UI & Features)
│   ├── lib/              # Shared library code (actions, auth, database)
│   └── types/            # TypeScript type declarations
```
