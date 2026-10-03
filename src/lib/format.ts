type Numeric = number | string | { toString(): string };

export function formatCurrency(value: Numeric): string {
  const n = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n || 0);
}

export function formatRatePerMile(value: Numeric): string {
  return `${formatCurrency(value)}/mi`;
}

export function formatMiles(value: Numeric): string {
  const n = Number(value);
  return `${new Intl.NumberFormat("en-US").format(Math.round(n || 0))} mi`;
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  FUEL: "Fuel",
  TRUCK_PAYMENT: "Truck Payment",
  INSURANCE: "Insurance",
  MAINTENANCE: "Maintenance",
  TIRES: "Tires",
  PERMITS_LICENSING: "Permits & Licensing",
  TOLLS: "Tolls",
  SOFTWARE_PHONE: "Software & Phone",
  PARKING: "Parking",
  LUMPER: "Lumper",
  DETENTION_FEES: "Detention Fees",
  SCALE_FEES: "Scale Fees",
  TRAILER_RENT: "Trailer Rent",
  DRIVER_ADVANCE: "Driver Advance",
  MEALS: "Meals",
  LODGING: "Lodging",
  TRAINING: "Training",
  UNIFORMS: "Uniforms",
  OFFICE_SUPPLIES: "Office Supplies",
  ACCOUNTING_LEGAL: "Accounting & Legal",
  BANK_FEES: "Bank Fees",
  FINES_VIOLATIONS: "Fines & Violations",
  CARGO_CLAIMS: "Cargo Claims",
  ELD_GPS: "ELD / GPS",
  DISPATCH_SERVICE: "Dispatch Service",
  ROAD_SIDE_ASSISTANCE: "Roadside Assistance",
  OTHER: "Other",
};

export const LOAD_STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export const TRUCK_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  IDLE: "Idle",
  INACTIVE: "Inactive",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  COI: "Certificate of Insurance",
  W9: "W-9",
  RATE_CON: "Rate Confirmation",
  BOL: "Bill of Lading",
  POD: "Proof of Delivery",
  RECEIPT: "Receipt",
  CDL: "CDL",
  MEDICAL_CARD: "Medical Card",
  DRUG_TEST_RESULT: "Drug Test Result",
  MVR: "MVR (Motor Vehicle Record)",
  OTHER: "Other",
};

// Driver-file-specific document types (company paperwork like COI/W9/rate
// cons lives on the Documents page instead).
export const DRIVER_FILE_DOCUMENT_TYPES = [
  "CDL",
  "MEDICAL_CARD",
  "DRUG_TEST_RESULT",
  "MVR",
  "OTHER",
] as const;

export type ExpiryStatus = "expired" | "expiring_soon" | "valid" | "none";

export function getExpiryStatus(expiresAt: Date | string | null): ExpiryStatus {
  if (!expiresAt) return "none";
  const date = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const daysUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 30) return "expiring_soon";
  return "valid";
}
