'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ─── Helper ──────────────────────────────────────────────────────────────────
async function getDB() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

// ─── Serialise Mongo doc → plain object ──────────────────────────────────────
function serialise(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
    features: typeof rest.features === 'string'
      ? rest.features.split(',').filter(Boolean)
      : (rest.features ?? []),
    availableFrom: rest.availableFrom ? new Date(rest.availableFrom).toISOString() : null,
    createdAt: rest.createdAt ? new Date(rest.createdAt).toISOString() : null,
    updatedAt: rest.updatedAt ? new Date(rest.updatedAt).toISOString() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE WAREHOUSE
// ─────────────────────────────────────────────────────────────────────────────
export async function createWarehouse(data: {
  name: string;
  address: string;
  area: number;
  totalCapacity: number;
  availableCapacity?: number;
  pricing: number;
  storageType: string;
  availableFrom: string;
  materialsAllowed: string;
  wdraStatus: boolean;
  gstNumber: string;
  images?: string;
  features: string[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in to register a facility." };
    }

    const db = await getDB();

    const result = await db.collection("warehouses").insertOne({
      name: data.name,
      address: data.address,
      area: data.area ?? 0,
      totalCapacity: Number(data.totalCapacity),
      availableCapacity: Number(data.availableCapacity ?? data.totalCapacity),
      pricing: data.pricing,
      storageType: data.storageType,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      materialsAllowed: data.materialsAllowed,
      wdraStatus: data.wdraStatus,
      gstNumber: data.gstNumber,
      images: data.images ?? "",
      features: data.features.join(","),
      // 🔑 Owner ID from the live MongoDB-authenticated session
      ownerId: session.user.id,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/dashboard/warehouse');
    return { success: true, data: { id: result.insertedId.toString() } };
  } catch (error: any) {
    console.error("[CREATE_WAREHOUSE_ERROR]", error);
    return { success: false, error: error.message || "Failed to create warehouse record." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE WAREHOUSE
// ─────────────────────────────────────────────────────────────────────────────
export async function updateWarehouse(id: string, data: {
  name: string;
  address: string;
  area: number;
  totalCapacity: number;
  pricing: number;
  storageType: string;
  availableFrom: string;
  materialsAllowed: string;
  wdraStatus: boolean;
  gstNumber: string;
  images?: string;
  features: string[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const db = await getDB();
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { id };

    await db.collection("warehouses").updateOne(filter, {
      $set: {
        ...data,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        features: data.features.join(","),
        images: data.images ?? "",
        status: "PENDING", // Re-trigger admin verification
        updatedAt: new Date(),
      }
    });

    revalidatePath('/dashboard/warehouse');
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_WAREHOUSE_ERROR]", error);
    return { success: false, error: "Update failed" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET OWNER WAREHOUSES
// ─────────────────────────────────────────────────────────────────────────────
export async function getOwnerWarehouses() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const db = await getDB();
    const docs = await db.collection("warehouses")
      .find({ ownerId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(serialise);
  } catch (error) {
    console.error("❌ [GET_WAREHOUSES_ERROR]", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { totalTransactions: 0, currentInventory: 0, activeWarehouses: 0, pendingRequests: 0 };
    }

    const db = await getDB();

    const warehouses = await db.collection("warehouses")
      .find({ ownerId: session.user.id })
      .toArray();

    const warehouseIds = warehouses.map(w => w._id.toString());

    const bookings = warehouseIds.length
      ? await db.collection("bookings")
          .find({ warehouseId: { $in: warehouseIds } })
          .toArray()
      : [];

    const activeWarehouses = warehouses.filter(w => w.status === 'APPROVED').length;
    const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;
    const totalTransactions = bookings.length;
    const currentInventory = bookings
      .filter(b => b.status === 'APPROVED')
      .reduce((sum, b) => sum + (b.weight || 0), 0);

    return { totalTransactions, currentInventory, activeWarehouses, pendingRequests };
  } catch (error) {
    console.error("[GET_LOGISTICS_STATS_ERROR]", error);
    return { totalTransactions: 0, currentInventory: 0, activeWarehouses: 0, pendingRequests: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET OWNER BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────
export async function getOwnerBookings(status?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const db = await getDB();

    // Get owner's warehouse IDs first
    const warehouses = await db.collection("warehouses")
      .find({ ownerId: session.user.id }, { projection: { _id: 1, name: 1, address: 1 } })
      .toArray();

    const warehouseIds = warehouses.map(w => w._id.toString());
    if (!warehouseIds.length) return [];

    const filter: any = { warehouseId: { $in: warehouseIds } };
    if (status) filter.status = status;

    const bookings = await db.collection("bookings")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich bookings with warehouse and client data
    return await Promise.all(bookings.map(async (booking) => {
      const warehouse = warehouses.find(w => w._id.toString() === booking.warehouseId);

      let client = null;
      if (booking.clientId) {
        try {
          client = await db.collection("users").findOne(
            { _id: new ObjectId(booking.clientId) },
            { projection: { name: 1, email: 1, phone: 1 } }
          );
        } catch {}
      }

      return {
        id: booking._id.toString(),
        ...booking,
        _id: undefined,
        warehouse: warehouse ? { name: warehouse.name, address: warehouse.address } : null,
        client: client ? { name: client.name, email: client.email, phone: client.phone } : null,
        createdAt: booking.createdAt?.toISOString?.() ?? booking.createdAt,
      };
    }));
  } catch (error) {
    console.error("[GET_OWNER_BOOKINGS_ERROR]", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE BOOKING STATUS
// ─────────────────────────────────────────────────────────────────────────────
export async function updateBookingStatus(bookingId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const db = await getDB();
    const filter = ObjectId.isValid(bookingId)
      ? { _id: new ObjectId(bookingId) }
      : { id: bookingId };

    const booking = await db.collection("bookings").findOne(filter);
    if (!booking) return { success: false, error: "Booking not found" };

    // Update booking status
    await db.collection("bookings").updateOne(filter, {
      $set: { status, updatedAt: new Date() }
    });

    // If approved → decrement available warehouse capacity
    if (status === 'APPROVED' && booking.warehouseId) {
      const wFilter = ObjectId.isValid(booking.warehouseId)
        ? { _id: new ObjectId(booking.warehouseId) }
        : { id: booking.warehouseId };

      await db.collection("warehouses").updateOne(wFilter, {
        $inc: { availableCapacity: -(booking.weight || 0) },
        $set: { updatedAt: new Date() }
      });
    }

    revalidatePath('/dashboard/warehouse');
    revalidatePath('/dashboard/warehouse/reports');
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_BOOKING_STATUS_ERROR]", error);
    return { success: false, error: "Failed to update booking status" };
  }
}
