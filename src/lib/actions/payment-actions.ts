"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { computePaymentAmounts } from "@/lib/business";

export type ActionState = { error?: string } | null;

export async function createPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const loadId = String(formData.get("loadId") || "");
  const date = String(formData.get("date") || "");
  const status = String(formData.get("status") || "PENDING") as "PENDING" | "RECEIVED";
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!loadId || !date) return { error: "Select a load and a date." };

  const load = await prisma.load.findFirst({
    where: { id: loadId, fleet: { companyId: user.companyId } },
    include: { driver: true, payment: true },
  });
  if (!load) return { error: "Load not found." };
  if (load.payment) return { error: "This load already has a payment." };

  // Every dollar figure here is derived server-side from the load record —
  // the UI only ever lets someone edit date/status/notes on a payment.
  const { grossAmount, driverFeeAmount, dispatcherEarning } = computePaymentAmounts(
    load,
    load.driver
      ? { driverPayType: load.driver.driverPayType, driverPayRate: load.driver.driverPayRate }
      : null,
    load.miles
  );

  await prisma.payment.create({
    data: {
      loadId,
      grossAmount,
      fuelAmount: 0,
      driverFeeAmount,
      dispatcherEarning,
      status,
      date: new Date(date),
      notes,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/loads");
  return null;
}

export async function updatePaymentStatus(paymentId: string, status: "PENDING" | "RECEIVED") {
  const user = await requireUser();
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, load: { fleet: { companyId: user.companyId } } },
  });
  if (!payment) throw new Error("Payment not found.");

  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}
