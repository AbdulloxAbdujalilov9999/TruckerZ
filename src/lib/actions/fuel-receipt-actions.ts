"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { uploadToStorage } from "@/lib/supabase-storage";

export type ActionState = { error?: string } | null;

export async function submitFuelReceipt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const truckId = String(formData.get("truckId") || "");
  const date = String(formData.get("date") || "");
  const state = String(formData.get("state") || "").toUpperCase();
  const gallons = Number(formData.get("gallons") || 0);
  const amount = Number(formData.get("amount") || 0);
  const description = String(formData.get("description") || "").trim() || null;
  const file = formData.get("file");

  if (!truckId || !date || !state || !gallons || !amount) {
    return { error: "Truck, date, state, gallons, and amount are all required." };
  }

  const truck = await prisma.truck.findFirst({
    where: { id: truckId, fleet: { companyId: user.companyId } },
  });
  if (!truck) return { error: "That truck doesn't belong to your company." };

  // Drivers can only log fuel against the truck they're actually assigned to.
  if (user.role === "DRIVER" && truck.driverId !== user.id) {
    return { error: "You can only submit receipts for your assigned truck." };
  }

  let receiptFilePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 15 * 1024 * 1024) return { error: "Receipt photo is larger than 15MB." };
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.companyId}/fuel-receipts/${randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToStorage(storagePath, buffer, file.type || "application/octet-stream");
    receiptFilePath = storagePath;
  }

  await prisma.expense.create({
    data: {
      companyId: user.companyId,
      truckId,
      category: "FUEL",
      amount,
      date: new Date(date),
      description,
      state,
      gallons,
      receiptFilePath,
      submittedById: user.id,
    },
  });

  revalidatePath("/fuel-receipts");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return null;
}
