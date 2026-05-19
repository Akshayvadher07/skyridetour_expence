'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getDB() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
export async function getClientDashboardStats() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { totalWeight: 0, activeBookings: 0, pendingRequests: 0 };

    const db = await getDB();
    const bookings = await db.collection("bookings")
      .find({ clientId: session.user.id })
      .toArray();

    const activeBookings = bookings.filter(b => b.status === 'APPROVED').length;
    const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;
    const totalWeight = bookings
      .filter(b => b.status === 'APPROVED')
      .reduce((sum, b) => sum + (b.weight || 0), 0);

    return { totalWeight, activeBookings, pendingRequests };
  } catch (error) {
    console.error("[CLIENT_STATS_ERROR]", error);
    return { totalWeight: 0, activeBookings: 0, pendingRequests: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEARCH WAREHOUSES
// ─────────────────────────────────────────────────────────────────────────────
export async function searchWarehouses(query: string = "", minWeight: number = 0) {
  console.log("🔍 [BACKEND-SEARCH-TRACE]", {
    query: query || "ALL",
    minWeight: `${minWeight} MT`,
    timestamp: new Date().toISOString()
  });

  try {
    const db = await getDB();

    const filter: any = {
      status: 'APPROVED',
      availableCapacity: { $gte: minWeight },
    };

    if (query && query.trim()) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ];
    }

    const docs = await db.collection("warehouses")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(w => ({
      id: w._id.toString(),
      name: w.name,
      address: w.address,
      totalCapacity: w.totalCapacity,
      availableCapacity: w.availableCapacity,
      pricing: w.pricing,
      storageType: w.storageType,
      wdraStatus: w.wdraStatus,
      gstNumber: w.gstNumber,
      images: w.images,
      features: typeof w.features === 'string' ? w.features.split(',').filter(Boolean) : (w.features ?? []),
      materialsAllowed: w.materialsAllowed,
      availableFrom: w.availableFrom,
      status: w.status,
    }));
  } catch (error) {
    console.error("[SEARCH_WAREHOUSES_ERROR]", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUBMIT CLIENT BOOKING REQUEST
// ─────────────────────────────────────────────────────────────────────────────
export async function submitClientRequest(data: {
  warehouseId: string;
  commodityType: string;
  weight: number;
  startDate: Date;
  endDate: Date;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const db = await getDB();

    await db.collection("bookings").insertOne({
      warehouseId: data.warehouseId,
      clientId: session.user.id,
      commodityType: data.commodityType,
      weight: data.weight,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'PENDING',
      bookingType: 'PLATFORM',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/dashboard/client');
    revalidatePath('/dashboard/client/history');
    revalidatePath('/dashboard/warehouse/bookings');

    return { success: true };
  } catch (error: any) {
    console.error("[SUBMIT_CLIENT_REQUEST_ERROR]", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT BOOKING HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export async function getClientBookingHistory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const db = await getDB();

    const bookings = await db.collection("bookings")
      .find({ clientId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with warehouse data
    return await Promise.all(bookings.map(async (booking) => {
      let warehouse = null;
      if (booking.warehouseId) {
        try {
          const filter = ObjectId.isValid(booking.warehouseId)
            ? { _id: new ObjectId(booking.warehouseId) }
            : { id: booking.warehouseId };
          warehouse = await db.collection("warehouses").findOne(filter, {
            projection: { name: 1, address: 1, pricing: 1 }
          });
        } catch {}
      }

      return {
        id: booking._id.toString(),
        ...booking,
        _id: undefined,
        status: booking.status,
        weight: booking.weight,
        commodityType: booking.commodityType,
        startDate: booking.startDate?.toISOString?.() ?? booking.startDate,
        endDate: booking.endDate?.toISOString?.() ?? booking.endDate,
        createdAt: booking.createdAt?.toISOString?.() ?? booking.createdAt,
        updatedAt: booking.updatedAt?.toISOString?.() ?? booking.updatedAt,
        warehouse: warehouse ? {
          name: warehouse.name,
          address: warehouse.address,
          pricing: warehouse.pricing,
        } : null,
      };
    }));
  } catch (error) {
    console.error("[CLIENT_BOOKING_HISTORY_ERROR]", error);
    return [];
  }
}
