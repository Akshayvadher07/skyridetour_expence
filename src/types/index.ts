// =============================================================================
// SkyRideTour — Shared TypeScript Types
// Extends Prisma-generated types with computed fields and API shapes.
// =============================================================================

import type {
  Vehicle,
  Driver,
  Trip,
  Expense,
  TollPass,
  Payment,
  Invoice,
  Setting,
  TripType,
  PaymentStatus,
  PaymentMethod,
  TollType,
  ExpenseCategory,
  DriverStatus,
  FuelType,
  VehicleType,
  UserRole,
} from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

// Re-export Prisma enums for convenience
export type {
  TripType, PaymentStatus, PaymentMethod, TollType,
  ExpenseCategory, DriverStatus, FuelType, VehicleType, UserRole,
  Decimal,
};

// =============================================================================
// COMPUTED TRIP TYPES
// =============================================================================

/** Trip with all relations loaded — used in trip detail view and PDF generation */
export interface TripWithRelations extends Trip {
  vehicle:  Vehicle | null;
  driver:   Driver  | null;
  expenses: Expense[];
  payments: Payment[];
  invoices: Invoice[];
}

/** Trip row as shown in the trips list — lightweight, for table rendering */
export interface TripListRow {
  id:            string;
  tripNumber:    string;
  date:          Date;
  customerName:  string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string | null;
  pickupLocation: string;
  dropLocation:  string;
  tripType:      TripType;
  tripAmount:    Decimal;
  totalExpense:  Decimal;
  netProfit:     Decimal;
  profitMargin:  Decimal;
  paymentStatus: PaymentStatus;
  vehicleName:   string | null;
  driverName:    string | null;
}

// =============================================================================
// VEHICLE TYPES
// =============================================================================

export interface VehicleWithStats extends Vehicle {
  trips:     Trip[];
  expenses:  Expense[];
  tollPasses: TollPass[];
  totalTrips:           number;
  totalRevenue:         Decimal;
  totalDirectExpenses:  Decimal;
  totalOverheadExpenses:Decimal;
  netContribution:      Decimal;
}

// =============================================================================
// DRIVER TYPES
// =============================================================================

export interface DriverWithStats extends Driver {
  trips: Trip[];
  totalTrips:         number;
  totalRevenue:       Decimal;
  totalAllowancePaid: Decimal;
  avgRevenuePerTrip:  Decimal;
}

// =============================================================================
// TOLL PASS TYPES
// =============================================================================

export interface TollPassWithStats extends TollPass {
  amortisedCostPerUse: Decimal;
  remainingValue:      Decimal;
  remainingUses:       number;
  utilizationPct:      number;
}

// =============================================================================
// EXPENSE TYPES
// =============================================================================

export interface OverheadExpenseRow extends Expense {
  vehicle: Vehicle | null;
}

export interface TripExpenseRow extends Expense {
  trip: Trip;
}

// =============================================================================
// DASHBOARD & ANALYTICS
// =============================================================================

export interface DashboardKPIs {
  todayRevenue:   number;
  todayExpenses:  number;
  todayNetProfit: number;
  todayTrips:     number;
  monthRevenue:   number;
  monthExpenses:  number;
  monthNetProfit: number;
  monthTrips:     number;
  pendingTotal:   number;
  pendingCount:   number;
  activeTripsNow: number;
}

export interface PendingPaymentRow {
  tripId:         string;
  tripNumber:     string;
  tripDate:       Date;
  customerName:   string;
  customerPhone:  string;
  pickupLocation: string;
  dropLocation:   string;
  tripAmount:     number;
  paidAmount:     number;
  pendingAmount:  number;
  paymentStatus:  PaymentStatus;
  daysOverdue:    number;
}

// =============================================================================
// SERVER ACTION RESULT
// =============================================================================

export type ActionResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: string };

export type AppSettings = Setting;
