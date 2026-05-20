/**
 * Kido AI seed — creates the default admin account.
 * Run: npx tsx prisma/seed-kido.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@kido.ai";
  const adminPassword = "KidoAdmin@2024";

  const hashed = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},  // Don't overwrite if already exists
    create: {
      name: "Kido Admin",
      email: adminEmail,
      password: hashed,
      role: "ADMIN",
      approved: true,
    },
  });

  console.log("✅ Kido AI admin created:");
  console.log("   Email:   ", admin.email);
  console.log("   Password:", adminPassword);
  console.log("   Role:    ", admin.role);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
