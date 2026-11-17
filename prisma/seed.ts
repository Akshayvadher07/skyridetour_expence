// =============================================================================
// SkyRideTour — Comprehensive Database Seed Script
// Populates admin user, business settings, vehicles, drivers, toll passes,
// standalone overhead expenses, and 10 realistic Gujarat trips (with inline customers).
// =============================================================================

import { PrismaClient, UserRole, FuelType, VehicleType, DriverStatus, TripType, PaymentStatus, PaymentMethod, TollType, ExpenseCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SkyRideTour Database Seeding...");

  // 1. Clean existing records safely
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.tollPass.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.create({
    data: {
      name:         "SkyRide Admin",
      email:        "admin@skyridetour.com",
      passwordHash: hashedPassword,
      role:         UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 3. Create Business Settings (Singleton)
  await prisma.setting.create({
    data: {
      companyName:    "SkyRideTour",
      phone:          "+91 98765 43210",
      email:          "info@skyridetour.com",
      address:        "Somnath, Gujarat, India",
      gstNumber:      "24AAAAA0000A1Z5",
      invoicePrefix:  "SRT-2026-",
      currencySymbol: "₹",
    },
  });
  console.log("✅ Business settings configured");

  // 4. Create Vehicles
  const v1 = await prisma.vehicle.create({
    data: {
      name:               "Ertiga CNG",
      registrationNumber: "GJ-01-AB-1234",
      model:              "Maruti Ertiga ZXi CNG",
      vehicleType:        VehicleType.SEDAN,
      fuelType:           FuelType.CNG,
      year:               2023,
      insuranceExpiry:    new Date("2027-06-30"),
      pucExpiry:          new Date("2027-03-15"),
      notes:              "Primary CNG fleet vehicle for local & long trips",
    },
  });

  const v2 = await prisma.vehicle.create({
    data: {
      name:               "Innova Crysta Diesel",
      registrationNumber: "GJ-03-CD-5678",
      model:              "Toyota Innova Crysta 2.4 VX",
      vehicleType:        VehicleType.SUV,
      fuelType:           FuelType.DIESEL,
      year:               2024,
      insuranceExpiry:    new Date("2027-08-20"),
      pucExpiry:          new Date("2027-05-10"),
      notes:              "Premium SUV for long-distance Gujarat tours",
    },
  });
  console.log("✅ 2 Vehicles created (Ertiga CNG & Innova Crysta Diesel)");

  // 5. Create Drivers
  const d1 = await prisma.driver.create({
    data: {
      name:          "Ramesh Kumar",
      phone:         "9876543210",
      licenseNumber: "GJ0120200123456",
      licenseExpiry: new Date("2028-10-15"),
      salary:        18000.00,
      joiningDate:   new Date("2024-01-10"),
      status:        DriverStatus.ACTIVE,
      notes:         "Experienced driver for Somnath & Dwarka routes",
    },
  });

  const d2 = await prisma.driver.create({
    data: {
      name:          "Suresh Jadav",
      phone:         "9712345678",
      licenseNumber: "GJ0320210987654",
      licenseExpiry: new Date("2028-12-01"),
      salary:        20000.00,
      joiningDate:   new Date("2023-05-15"),
      status:        DriverStatus.ACTIVE,
      notes:         "Specialist in long multi-day state trips",
    },
  });
  console.log("✅ 2 Drivers created (Ramesh Kumar & Suresh Jadav)");

  // 6. Create Active Annual Toll Pass for Ertiga CNG
  await prisma.tollPass.create({
    data: {
      passName:      "NH-48 Gujarat Highway Annual Pass",
      vehicleId:     v1.id,
      passCost:      1500.00,
      tollsIncluded: 100,
      tollsUsed:     4,
      startDate:     new Date("2026-01-01"),
      expiryDate:    new Date("2026-12-31"),
      isActive:      true,
      notes:         "Covers Somnath-Rajkot-Ahmedabad toll plaza cluster",
    },
  });
  console.log("✅ Active Annual Toll Pass logged");

  // 7. Create Standalone Overhead Expenses
  await prisma.expense.createMany({
    data: [
      {
        date:        new Date("2026-07-01"),
        category:    ExpenseCategory.MAINTENANCE,
        amount:      3500.00,
        description: "Ertiga CNG 20,000 km routine service & oil change",
        vehicleId:   v1.id,
      },
      {
        date:        new Date("2026-07-05"),
        category:    ExpenseCategory.DRIVER_SALARY,
        amount:      18000.00,
        description: "Ramesh Kumar monthly base salary — July 2026",
      },
      {
        date:        new Date("2026-07-10"),
        category:    ExpenseCategory.INSURANCE,
        amount:      8500.00,
        description: "Innova Crysta annual insurance renewal",
        vehicleId:   v2.id,
      },
    ],
  });
  console.log("✅ Standalone overhead expenses logged");

  // 8. Create 10 Realistic Gujarat Trips with INLINE Customer Details
  const tripsData = [
    // ── BENCHMARK TRIP (Trip #1) ─────────────────────────────────────────────
    {
      tripNumber:     "SRT-2026-0001",
      date:           new Date("2026-07-25"),
      customerName:   "Amit Shah",
      customerPhone:  "9979054321",
      customerEmail:  "ashah@yahoo.in",
      customerAddress:"Kalawad Road, Rajkot, Gujarat",
      vehicleId:      v1.id,
      driverId:       d1.id,
      pickupLocation: "Somnath",
      dropLocation:   "Somnath",
      tripType:       TripType.ROUND_TRIP,
      tripAmount:     3000.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.UPI,
      cngExpense:     800.00,
      petrolExpense:  0.00,
      dieselExpense:  0.00,
      tollType:       TollType.ANNUAL_PASS,
      tollExpense:    0.00,
      parkingExpense: 200.00,
      driverExpense:  150.00,
      foodExpense:    0.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   1150.00,
      netProfit:      1850.00,
      profitMargin:   61.67,
      notes:          "Mandatory benchmark test trip: Somnath Local Temple Tour",
    },

    // Trip #2: Ahmedabad -> Somnath (One Way)
    {
      tripNumber:     "SRT-2026-0002",
      date:           new Date("2026-08-01"),
      customerName:   "Rajesh Patel",
      customerPhone:  "9825012345",
      customerEmail:  "rajesh.patel@gmail.com",
      customerAddress:"Satellite, Ahmedabad, Gujarat",
      vehicleId:      v2.id,
      driverId:       d2.id,
      pickupLocation: "Ahmedabad Airport",
      dropLocation:   "Somnath Temple",
      tripType:       TripType.ONE_WAY,
      tripAmount:     8500.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.BANK_TRANSFER,
      cngExpense:     0.00,
      petrolExpense:  0.00,
      dieselExpense:  2800.00,
      tollType:       TollType.FASTAG,
      tollExpense:    450.00,
      parkingExpense: 100.00,
      driverExpense:  500.00,
      foodExpense:    250.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   4100.00,
      netProfit:      4400.00,
      profitMargin:   51.76,
      notes:          "Airport pickup for corporate guest",
    },

    // Trip #3: Rajkot -> Dwarka (Round Trip)
    {
      tripNumber:     "SRT-2026-0003",
      date:           new Date("2026-08-05"),
      customerName:   "Amit Shah",
      customerPhone:  "9979054321",
      customerEmail:  "ashah@yahoo.in",
      customerAddress:"Kalawad Road, Rajkot, Gujarat",
      vehicleId:      v1.id,
      driverId:       d1.id,
      pickupLocation: "Rajkot",
      dropLocation:   "Dwarkadhish Temple",
      tripType:       TripType.ROUND_TRIP,
      tripAmount:     5500.00,
      paymentStatus:  PaymentStatus.PARTIAL,
      paymentMethod:  PaymentMethod.UPI,
      cngExpense:     1400.00,
      petrolExpense:  0.00,
      dieselExpense:  0.00,
      tollType:       TollType.FASTAG,
      tollExpense:    320.00,
      parkingExpense: 150.00,
      driverExpense:  300.00,
      foodExpense:    200.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   2370.00,
      netProfit:      3130.00,
      profitMargin:   56.91,
      notes:          "Dwarka day trip, balance ₹1,500 pending",
    },

    // Trip #4: Surat -> Gir Forest (Multi-Day)
    {
      tripNumber:     "SRT-2026-0004",
      date:           new Date("2026-08-10"),
      customerName:   "Priya Mehta",
      customerPhone:  "9898098765",
      customerEmail:  "priya.mehta@outlook.com",
      customerAddress:"Vesu, Surat, Gujarat",
      vehicleId:      v2.id,
      driverId:       d2.id,
      pickupLocation: "Surat",
      dropLocation:   "Sasan Gir Safari",
      tripType:       TripType.MULTI_DAY,
      startDate:      new Date("2026-08-10"),
      endDate:        new Date("2026-08-13"),
      tripAmount:     18000.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.BANK_TRANSFER,
      cngExpense:     0.00,
      petrolExpense:  0.00,
      dieselExpense:  5200.00,
      tollType:       TollType.FASTAG,
      tollExpense:    850.00,
      parkingExpense: 400.00,
      driverExpense:  2000.00,
      foodExpense:    1200.00,
      accommodationExpense: 1500.00,
      otherExpense:   0.00,
      totalExpense:   11150.00,
      netProfit:      6850.00,
      profitMargin:   38.06,
      notes:          "3-day Gir Wildlife Safari family package",
    },

    // Trip #5: Somnath -> Diu (Local Tour)
    {
      tripNumber:     "SRT-2026-0005",
      date:           new Date("2026-08-15"),
      customerName:   "Amit Shah",
      customerPhone:  "9979054321",
      customerEmail:  "ashah@yahoo.in",
      customerAddress:"Kalawad Road, Rajkot, Gujarat",
      vehicleId:      v1.id,
      driverId:       d1.id,
      pickupLocation: "Somnath",
      dropLocation:   "Diu Beach & Fort",
      tripType:       TripType.ROUND_TRIP,
      tripAmount:     4000.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.CASH,
      cngExpense:     950.00,
      petrolExpense:  0.00,
      dieselExpense:  0.00,
      tollType:       TollType.FREE,
      tollExpense:    0.00,
      parkingExpense: 100.00,
      driverExpense:  200.00,
      foodExpense:    150.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   1400.00,
      netProfit:      2600.00,
      profitMargin:   65.00,
      notes:          "Independence Day Diu excursion",
    },

    // Trip #6: Ahmedabad -> Junagadh (One Way)
    {
      tripNumber:     "SRT-2026-0006",
      date:           new Date("2026-08-20"),
      customerName:   "Rajesh Patel",
      customerPhone:  "9825012345",
      customerEmail:  "rajesh.patel@gmail.com",
      customerAddress:"Satellite, Ahmedabad, Gujarat",
      vehicleId:      v2.id,
      driverId:       d2.id,
      pickupLocation: "Ahmedabad",
      dropLocation:   "Junagadh Girnar Ropeway",
      tripType:       TripType.ONE_WAY,
      tripAmount:     7200.00,
      paymentStatus:  PaymentStatus.PENDING,
      paymentMethod:  PaymentMethod.UPI,
      cngExpense:     0.00,
      petrolExpense:  0.00,
      dieselExpense:  2400.00,
      tollType:       TollType.FASTAG,
      tollExpense:    380.00,
      parkingExpense: 100.00,
      driverExpense:  400.00,
      foodExpense:    0.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   3280.00,
      netProfit:      3920.00,
      profitMargin:   54.44,
      notes:          "Girnar pilgrimage transport, payment pending",
    },

    // Trip #7: Rajkot -> Somnath (Round Trip)
    {
      tripNumber:     "SRT-2026-0007",
      date:           new Date("2026-08-25"),
      customerName:   "Amit Shah",
      customerPhone:  "9979054321",
      customerEmail:  "ashah@yahoo.in",
      customerAddress:"Kalawad Road, Rajkot, Gujarat",
      vehicleId:      v1.id,
      driverId:       d1.id,
      pickupLocation: "Rajkot Junction",
      dropLocation:   "Somnath Darshan",
      tripType:       TripType.ROUND_TRIP,
      tripAmount:     4800.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.UPI,
      cngExpense:     1100.00,
      petrolExpense:  0.00,
      dieselExpense:  0.00,
      tollType:       TollType.ANNUAL_PASS,
      tollExpense:    0.00,
      parkingExpense: 150.00,
      driverExpense:  250.00,
      foodExpense:    100.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   1600.00,
      netProfit:      3200.00,
      profitMargin:   66.67,
      notes:          "Train arrival connection",
    },

    // Trip #8: Surat -> Ahmedabad (One Way)
    {
      tripNumber:     "SRT-2026-0008",
      date:           new Date("2026-09-01"),
      customerName:   "Priya Mehta",
      customerPhone:  "9898098765",
      customerEmail:  "priya.mehta@outlook.com",
      customerAddress:"Vesu, Surat, Gujarat",
      vehicleId:      v2.id,
      driverId:       d2.id,
      pickupLocation: "Surat Railway Station",
      dropLocation:   "Ahmedabad GIFT City",
      tripType:       TripType.ONE_WAY,
      tripAmount:     6500.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.BANK_TRANSFER,
      cngExpense:     0.00,
      petrolExpense:  0.00,
      dieselExpense:  2100.00,
      tollType:       TollType.FASTAG,
      tollExpense:    360.00,
      parkingExpense: 100.00,
      driverExpense:  350.00,
      foodExpense:    150.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   3060.00,
      netProfit:      3440.00,
      profitMargin:   52.92,
      notes:          "Business transfer to GIFT City",
    },

    // Trip #9: Somnath -> Dwarka -> Porbandar (Multi-Day)
    {
      tripNumber:     "SRT-2026-0009",
      date:           new Date("2026-09-08"),
      customerName:   "Rajesh Patel",
      customerPhone:  "9825012345",
      customerEmail:  "rajesh.patel@gmail.com",
      customerAddress:"Satellite, Ahmedabad, Gujarat",
      vehicleId:      v1.id,
      driverId:       d1.id,
      pickupLocation: "Somnath",
      dropLocation:   "Porbandar Beach",
      tripType:       TripType.MULTI_DAY,
      startDate:      new Date("2026-09-08"),
      endDate:        new Date("2026-09-10"),
      tripAmount:     12000.00,
      paymentStatus:  PaymentStatus.PARTIAL,
      paymentMethod:  PaymentMethod.UPI,
      cngExpense:     2800.00,
      petrolExpense:  0.00,
      dieselExpense:  0.00,
      tollType:       TollType.NORMAL,
      tollExpense:    450.00,
      parkingExpense: 300.00,
      driverExpense:  1200.00,
      foodExpense:    800.00,
      accommodationExpense: 1000.00,
      otherExpense:   0.00,
      totalExpense:   6550.00,
      netProfit:      5450.00,
      profitMargin:   45.42,
      notes:          "Saurashtra coastal tour, ₹4,000 balance remaining",
    },

    // Trip #10: Rajkot -> Bhuj (Round Trip)
    {
      tripNumber:     "SRT-2026-0010",
      date:           new Date("2026-09-14"),
      customerName:   "Amit Shah",
      customerPhone:  "9979054321",
      customerEmail:  "ashah@yahoo.in",
      customerAddress:"Kalawad Road, Rajkot, Gujarat",
      vehicleId:      v2.id,
      driverId:       d2.id,
      pickupLocation: "Rajkot",
      dropLocation:   "Bhuj Rann of Kutch",
      tripType:       TripType.ROUND_TRIP,
      tripAmount:     11000.00,
      paymentStatus:  PaymentStatus.PAID,
      paymentMethod:  PaymentMethod.BANK_TRANSFER,
      cngExpense:     0.00,
      petrolExpense:  0.00,
      dieselExpense:  3600.00,
      tollType:       TollType.FASTAG,
      tollExpense:    520.00,
      parkingExpense: 200.00,
      driverExpense:  600.00,
      foodExpense:    300.00,
      accommodationExpense: 0.00,
      otherExpense:   0.00,
      totalExpense:   5220.00,
      netProfit:      5780.00,
      profitMargin:   52.55,
      notes:          "Kutch white desert sightseeing tour",
    },
  ];

  for (const t of tripsData) {
    const trip = await prisma.trip.create({ data: t });

    if (t.paymentStatus === PaymentStatus.PAID) {
      await prisma.payment.create({
        data: {
          tripId:        trip.id,
          amount:        t.tripAmount,
          paymentDate:   t.date,
          paymentMethod: t.paymentMethod,
          notes:         "Full payment received",
        },
      });
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${trip.tripNumber.split("-")[2]}`,
          tripId:        trip.id,
          issueDate:     t.date,
          totalAmount:   t.tripAmount,
          discount:      0,
          paidAmount:    t.tripAmount,
          status:        PaymentStatus.PAID,
        },
      });
    } else if (t.paymentStatus === PaymentStatus.PARTIAL) {
      const partialAmt = Math.round(t.tripAmount * 0.6);
      await prisma.payment.create({
        data: {
          tripId:        trip.id,
          amount:        partialAmt,
          paymentDate:   t.date,
          paymentMethod: t.paymentMethod,
          notes:         "Advance installment received",
        },
      });
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${trip.tripNumber.split("-")[2]}`,
          tripId:        trip.id,
          issueDate:     t.date,
          totalAmount:   t.tripAmount,
          discount:      0,
          paidAmount:    partialAmt,
          status:        PaymentStatus.PARTIAL,
        },
      });
    }
  }

  console.log("✅ 10 Realistic Gujarat trips created with inline customer details");
  console.log("=========================================================");
  console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY 100%");
  console.log("=========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
