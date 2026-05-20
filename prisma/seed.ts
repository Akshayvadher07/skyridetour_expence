import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing database connection...");

  // Generate cryptographic hash for the default Admin password
  const hashedAdminPassword = await bcrypt.hash("admin@098", 10);

  // Use idempotent upsert to prevent unique constraint crashes
  await prisma.user.upsert({
    where: { email: "bharatgodam.techsolutions@gmail.com" },
    update: {
      // Update the password if it changed during maintenance windows
      password: hashedAdminPassword, 
    },
    create: {
      email: "bharatgodam.techsolutions@gmail.com",
      name: "bharatgodam",
      password: hashedAdminPassword,
      role: "ADMIN",
      approved: true,
      // phone: "8796543210", // Mapped from 'mobileNo' to schema's actual 'phone' field
      // location: "ahmedabad",
      // gstNumber: "na",
      // Note: 'completionAcknowledged' omitted as it belongs to the Booking model, not User
    },
  });
}

main()
  .then(async () => {
    console.log("🚀 Root Admin account 'bharatgodam' successfully seeded!");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding operation aborted due to an exception:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
