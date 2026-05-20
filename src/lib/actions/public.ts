'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { revalidatePath } from "next/cache";

export async function getPublicWarehouses() {
  try {
    return await prisma.warehouse.findMany({
      where: {
        status: 'APPROVED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error("[GET_PUBLIC_WAREHOUSES_ERROR]", error);
    return [];
  }
}

// export async function registerUser(formData: any) {
//   try {
//     const { 
//       email, 
//       password, 
//       name, 
//       role, 
//       phone, 
//       location,
//       companyName,
//       warehouseCount,
//       city,
//       businessType,
//       gstNumber,
//       requirements
//     } = formData;

//     const client = await clientPromise;
//     const db = client.db(process.env.MONGODB_DB);

//     // 1. Check if user already exists
//     const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });

//     if (existingUser) {
//       return { success: false, error: "Identity with this email already exists." };
//     }

//     // 2. Hash password safely
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 3. Create user in PENDING state directly in MongoDB
//     await db.collection("users").insertOne({
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       name,
//       role,
//       phone,
//       location,
//       approvalStatus: "PENDING",
//       companyName: role === "OWNER" ? companyName : (companyName || null),
//       warehouseCount: role === "OWNER" ? (parseInt(warehouseCount) || 0) : null,
//       city: role === "CLIENT" ? city : null,
//       businessType: role === "CLIENT" ? businessType : null,
//       gstNumber: gstNumber === "NA" ? "NA" : (gstNumber || null),
//       requirements: role === "CLIENT" ? requirements : null,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     revalidatePath('/admin/approvals');

//     return { success: true };
//   } catch (error: any) {
//     console.error("[REGISTER_USER_ERROR_STATE]", {
//       message: error.message,
//       name: error.name,
//       code: error.code
//     });
    
//     if (error.name === 'MongoNetworkError' || error.message?.includes('SSL routines') || error.message?.includes('tlsv1 alert')) {
//       return { 
//         success: false, 
//         error: "NETWORK HANDSHAKE FAILED: Unable to establish secure connection to the Cloud Cluster. If this persists locally, switch from 'mongodb+srv://' to standard 'mongodb://' in your .env." 
//       };
//     }
    
//     return { success: false, error: error.message || "Registration failed. Please try again." };
//   }
// }


export async function registerUser(formData: any) {
  try {
    const {
      email,
      password,
      name,
      role,
    } = formData;

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Identity with this email already exists.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name,
        role,
        approved: false,
      },
    });

    revalidatePath("/admin/approvals");

    return { success: true };

  } catch (error: any) {
    console.error("[REGISTER_USER_ERROR]", error);

    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
}