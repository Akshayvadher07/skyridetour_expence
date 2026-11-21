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
Run MongoDB locally, then generate the Prisma Client and sync the schema:
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
