import { Prisma } from "@/generated/prisma/client";

type Decimal = Prisma.Decimal;

/**
 * Status transitions a human can make from the UI. DELIVERED is reachable
 * only via an explicit manual action — no code path in this app ever sets
 * it as a side effect of something else, so a future automation engine
 * (Phase 2) has nowhere wrong to plug in and silently confirm a customer
 * obligation on someone's behalf.
 */
export const LOAD_STATUS_FLOW = [
  "BOOKED",
  "IN_TRANSIT",
  "DELIVERED",
  "INVOICED",
  "PAID",
] as const;

export type LoadStatusValue = (typeof LOAD_STATUS_FLOW)[number];

export function nextManualStatuses(current: LoadStatusValue): LoadStatusValue[] {
  const idx = LOAD_STATUS_FLOW.indexOf(current);
  // Allow moving forward one step, or back one step (to correct a mistake).
  const options: LoadStatusValue[] = [];
  if (idx > 0) options.push(LOAD_STATUS_FLOW[idx - 1]);
  if (idx < LOAD_STATUS_FLOW.length - 1) options.push(LOAD_STATUS_FLOW[idx + 1]);
  return options;
}

type LoadForPayment = {
  rate: Decimal | number | string;
  deductions: Decimal | number | string;
  dispatchFeePercent: Decimal | number | string;
};

type DriverPay = {
  driverPayType: "PERCENTAGE" | "PER_MILE" | "SALARY" | "HOURLY" | null;
  driverPayRate: Decimal | number | string | null;
};

/**
 * Computes the read-only financial fields for a Payment from its Load.
 * This is the only place these numbers are derived — the UI never accepts
 * them as raw input, matching the "financial fields are auto-calculated
 * and read-only" rule observed in the real app's Create Payment modal.
 */
export function computePaymentAmounts(
  load: LoadForPayment,
  driver: DriverPay | null,
  miles: Decimal | number | string
) {
  const rate = Number(load.rate);
  const deductions = Number(load.deductions);
  const dispatchFeePercent = Number(load.dispatchFeePercent);
  const milesNum = Number(miles);

  const grossAmount = Math.max(rate - deductions, 0);
  const dispatcherEarning = +(grossAmount * (dispatchFeePercent / 100)).toFixed(2);

  let driverFeeAmount = 0;
  if (driver?.driverPayType && driver.driverPayRate != null) {
    const payRate = Number(driver.driverPayRate);
    switch (driver.driverPayType) {
      case "PERCENTAGE":
        driverFeeAmount = +(grossAmount * (payRate / 100)).toFixed(2);
        break;
      case "PER_MILE":
        driverFeeAmount = +(milesNum * payRate).toFixed(2);
        break;
      case "SALARY":
      case "HOURLY":
        // Salary/hourly driver pay is run on a payroll cycle, not per load.
        driverFeeAmount = 0;
        break;
    }
  }

  return {
    grossAmount: +grossAmount.toFixed(2),
    dispatcherEarning,
    driverFeeAmount,
  };
}
