"use server";

// =============================================================================
// SkyRideTour — Customer Server Actions (Deprecated)
// Customer details are now inlined directly into the Trip entity.
// =============================================================================

import type { ActionResult } from "@/types";

export interface CustomerListItem {
  id:           string;
  name:         string;
  phone:        string;
  email:        string | null;
  address:      string | null;
  notes:        string | null;
  createdAt:    Date;
  updatedAt:    Date;
  _count:       { trips: number };
  totalSpent:   number;
  lastTripDate: Date | null;
}

export async function getCustomers(): Promise<ActionResult<{ customers: CustomerListItem[]; total: number; totalPages: number }>> {
  return { success: true, data: { customers: [], total: 0, totalPages: 0 } };
}

export async function getCustomerById(): Promise<ActionResult<null>> {
  return { success: false, error: "Customer section has been inlined into Trips." };
}

export async function createCustomer(): Promise<ActionResult<null>> {
  return { success: false, error: "Customer details are recorded directly inside Trips." };
}

export async function updateCustomer(): Promise<ActionResult<null>> {
  return { success: false, error: "Customer details are recorded directly inside Trips." };
}

export async function deleteCustomer(): Promise<ActionResult<null>> {
  return { success: false, error: "Customer details are recorded directly inside Trips." };
}
