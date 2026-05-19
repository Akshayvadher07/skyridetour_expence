'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function getAllUsers() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return [];

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
  
  return users.map(user => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    createdAt: user.createdAt
  }));
}

export async function createNewUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'OWNER' | 'CLIENT' | 'ADMIN';
}) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 1. Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    const result = await db.collection("users").insertOne({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      approvalStatus: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/admin/users');
    return { success: true, user: { id: result.insertedId.toString(), email: data.email } };
  } catch (error: any) {
    console.error("[CREATE_USER_ERROR]", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getPendingRegistrations() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return [];

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const pendingUsers = await db.collection("users")
    .find({ approvalStatus: "PENDING" })
    .sort({ createdAt: -1 })
    .toArray();

  return pendingUsers.map(user => ({
    ...user,
    id: user._id.toString(),
    _id: undefined
  }));
}

export async function updateUserApprovalStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { approvalStatus: status } }
    );

    revalidatePath('/admin/approvals');
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_USER_APPROVAL_ERROR]", error);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function getPendingWarehouses() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return [];

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const docs = await db.collection("warehouses")
    .find({ status: 'PENDING' })
    .sort({ createdAt: -1 })
    .toArray();

  return await Promise.all(docs.map(async (w) => {
    let owner = null;
    if (w.ownerId) {
      try {
        owner = await db.collection("users").findOne(
          { _id: new ObjectId(w.ownerId) },
          { projection: { name: 1, email: 1, phone: 1 } }
        );
      } catch {}
    }
    return {
      id: w._id.toString(),
      ...w,
      _id: undefined,
      owner: owner ? { id: w.ownerId, name: owner.name, email: owner.email, phone: owner.phone } : null,
    };
  }));
}

export async function verifyWarehouse(warehouseId: string, action: 'APPROVED' | 'REJECTED', reason?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const filter = ObjectId.isValid(warehouseId)
      ? { _id: new ObjectId(warehouseId) }
      : { id: warehouseId };

    await db.collection("warehouses").updateOne(filter, {
      $set: { 
        status: action,
        rejectionReason: action === 'REJECTED' ? (reason ?? null) : null,
        updatedAt: new Date()
      }
    });

    revalidatePath('/admin/warehouses');
    revalidatePath('/dashboard/warehouse/warehouses');
    return { success: true };
  } catch (error) {
    console.error("[VERIFY_WAREHOUSE_ERROR]", error);
    return { success: false, error: "Failed to verify warehouse" };
  }
}

// 🏛️ MASTER BOOKING HISTORY ACTIONS
export async function getMasterBookingLedger() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return [];

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const bookings = await db.collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return await Promise.all(bookings.map(async (booking) => {
      let clientUser = null;
      let warehouse = null;

      if (booking.clientId) {
        try {
          clientUser = await db.collection("users").findOne(
            { _id: new ObjectId(booking.clientId) },
            { projection: { name: 1, email: 1, phone: 1, businessType: 1, city: 1 } }
          );
        } catch {}
      }

      if (booking.warehouseId) {
        try {
          const wFilter = ObjectId.isValid(booking.warehouseId)
            ? { _id: new ObjectId(booking.warehouseId) }
            : { id: booking.warehouseId };
          const wDoc = await db.collection("warehouses").findOne(wFilter, {
            projection: { name: 1, address: 1, ownerId: 1 }
          });
          if (wDoc) {
            let owner = null;
            if (wDoc.ownerId) {
              try {
                owner = await db.collection("users").findOne(
                  { _id: new ObjectId(wDoc.ownerId) },
                  { projection: { name: 1, email: 1, phone: 1 } }
                );
              } catch {}
            }
            warehouse = { name: wDoc.name, address: wDoc.address, owner };
          }
        } catch {}
      }

      return {
        id: booking._id.toString(),
        ...booking,
        _id: undefined,
        client: clientUser,
        warehouse,
        createdAt: booking.createdAt?.toISOString?.() ?? booking.createdAt,
      };
    }));
  } catch (error) {
    console.error("[GET_MASTER_BOOKINGS_ERROR]", error);
    return [];
  }
}

export async function adminForceCancelBooking(bookingId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const bFilter = ObjectId.isValid(bookingId)
      ? { _id: new ObjectId(bookingId) }
      : { id: bookingId };

    const booking = await db.collection("bookings").findOne(bFilter);
    if (!booking) throw new Error("Booking not found");

    // Cancel booking
    await db.collection("bookings").updateOne(bFilter, {
      $set: { status: 'REJECTED', updatedAt: new Date() }
    });

    // Restore capacity to the warehouse
    if (booking.warehouseId) {
      const wFilter = ObjectId.isValid(booking.warehouseId)
        ? { _id: new ObjectId(booking.warehouseId) }
        : { id: booking.warehouseId };

      await db.collection("warehouses").updateOne(wFilter, {
        $inc: { availableCapacity: booking.weight || 0 },
        $set: { updatedAt: new Date() }
      });
    }

    revalidatePath('/admin/bookings');
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN_CANCEL_BOOKING_ERROR]", error);
    return { success: false, error: error.message };
  }
}
