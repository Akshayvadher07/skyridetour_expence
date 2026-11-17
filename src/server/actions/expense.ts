"use server";

import { revalidatePath }  from "next/cache";
import { prisma }          from "@/lib/prisma";
import {
  expenseSchema,
  updateExpenseSchema,
  type ExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validators/expense";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

export type ExpenseWithRefs = Prisma.ExpenseGetPayload<{
  include: {
    vehicle: { select: { name: true; registrationNumber: true } };
    trip:    { select: { tripNumber: true } };
  };
}>;

export interface ExpenseSummary {
  totalAmount:   number;
  byCategory:    Record<string, number>;
  expenses:      ExpenseWithRefs[];
}

export async function getExpenses(opts?: {
  vehicleId?:  string;
  tripId?:     string;
  category?:   string;
  dateFrom?:   string;
  dateTo?:     string;
  limit?:      number;
  page?:       number;
}): Promise<ActionResult<{ expenses: ExpenseWithRefs[]; total: number; totalAmount: number }>> {
  try {
    const {
      vehicleId, tripId, category,
      dateFrom, dateTo,
      limit = 50, page = 1,
    } = opts ?? {};

    const where: Prisma.ExpenseWhereInput = {
      ...(vehicleId && { vehicleId }),
      ...(tripId    && { tripId }),
      ...(category  && { category: category as Prisma.EnumExpenseCategoryFilter }),
      ...(dateFrom  && { date: { gte: new Date(dateFrom) } }),
      ...(dateTo    && { date: { lte: new Date(dateTo) } }),
      ...(dateFrom && dateTo && {
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      }),
    };

    const skip = (page - 1) * limit;

    const [expenses, total, agg] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          vehicle: { select: { name: true, registrationNumber: true } },
          trip:    { select: { tripNumber: true } },
        },
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      success: true,
      data: {
        expenses,
        total,
        totalAmount: Number(agg._sum.amount ?? 0),
      },
    };
  } catch (err) {
    console.error("[getExpenses]", err);
    return { success: false, error: "Failed to fetch expenses." };
  }
}

export async function createExpense(
  data: ExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = expenseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        date:        new Date(d.date),
        category:    d.category,
        amount:      d.amount,
        description: d.description || null,
        vehicleId:   d.vehicleId   || null,
        tripId:      d.tripId      || null,
      },
      select: { id: true },
    });

    revalidatePath("/expenses");
    return { success: true, data: expense };
  } catch (err) {
    console.error("[createExpense]", err);
    return { success: false, error: "Failed to create expense." };
  }
}

export async function updateExpense(
  id:   string,
  data: UpdateExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = updateExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(d.date        !== undefined && { date:        new Date(d.date) }),
        ...(d.category    !== undefined && { category:    d.category }),
        ...(d.amount      !== undefined && { amount:      d.amount }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.vehicleId   !== undefined && { vehicleId:   d.vehicleId   || null }),
        ...(d.tripId      !== undefined && { tripId:      d.tripId      || null }),
      },
      select: { id: true },
    });

    revalidatePath("/expenses");
    return { success: true, data: expense };
  } catch (err) {
    console.error("[updateExpense]", err);
    return { success: false, error: "Failed to update expense." };
  }
}

export async function deleteExpense(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/expenses");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[deleteExpense]", err);
    return { success: false, error: "Failed to delete expense." };
  }
}

/** Category breakdown for a date range — used in dashboard and reports */
export async function getExpenseCategoryBreakdown(
  dateFrom?: string,
  dateTo?:   string
): Promise<ActionResult<{ category: string; total: number }[]>> {
  try {
    const where: Prisma.ExpenseWhereInput = {
      ...(dateFrom && dateTo && {
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      }),
    };

    const grouped = await prisma.expense.groupBy({
      by:      ["category"],
      where,
      _sum:    { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    return {
      success: true,
      data: grouped.map((g) => ({
        category: g.category,
        total:    Number(g._sum.amount ?? 0),
      })),
    };
  } catch (err) {
    console.error("[getExpenseCategoryBreakdown]", err);
    return { success: false, error: "Failed to compute breakdown." };
  }
}
