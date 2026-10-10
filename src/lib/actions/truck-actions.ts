"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export type ActionState = { error?: string } | null;

export async function createTruck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const fleetId = String(formData.get("fleetId") || "");
  const unitNumber = String(formData.get("unitNumber") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const vin = String(formData.get("vin") || "").trim();
  const trailerNumber = String(formData.get("trailerNumber") || "").trim();
  const status = String(formData.get("status") || "ACTIVE");
  const driverId = String(formData.get("driverId") || "") || null;

  if (!fleetId || !unitNumber) {
    return { error: "Fleet and unit number are required." };
  }

  const fleet = await prisma.fleet.findFirst({
    where: { id: fleetId, companyId: user.companyId },
  });
  if (!fleet) return { error: "That fleet doesn't belong to your company." };

  await prisma.truck.create({
    data: {
      fleetId,
      unitNumber,
      type: type || null,
      vin: vin || null,
      trailerNumber: trailerNumber || null,
      status: status as "ACTIVE" | "IDLE" | "INACTIVE",
      driverId,
    },
  });

  revalidatePath("/trucks");
  return null;
}

export async function updateTruckStatus(truckId: string, status: "ACTIVE" | "IDLE" | "INACTIVE") {
  const user = await requireUser();
  const truck = await prisma.truck.findFirst({
    where: { id: truckId, fleet: { companyId: user.companyId } },
  });
  if (!truck) throw new Error("Truck not found.");

  await prisma.truck.update({ where: { id: truckId }, data: { status } });
  revalidatePath("/trucks");
}
