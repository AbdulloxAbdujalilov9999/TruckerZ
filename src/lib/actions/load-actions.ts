"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { nextManualStatuses, LOAD_STATUS_FLOW, type LoadStatusValue } from "@/lib/business";

export type ActionState = { error?: string } | null;

type StopInput = { type: "PICKUP" | "STOP" | "DELIVERY"; address: string; city: string; state: string };
type AccessorialInput = { label: string; amount: number };

export async function createLoad(
  _prev: ActionState,
  formData: FormData,
  extra: { stops: StopInput[]; accessorials: AccessorialInput[] }
): Promise<ActionState> {
  const user = await requireUser();

  const fleetId = String(formData.get("fleetId") || "");
  const truckId = String(formData.get("truckId") || "");
  const driverId = String(formData.get("driverId") || "") || null;
  const loadNumber = String(formData.get("loadNumber") || "").trim() || null;
  const status = String(formData.get("status") || "BOOKED") as LoadStatusValue;

  const originAddress = String(formData.get("originAddress") || "").trim();
  const originCity = String(formData.get("originCity") || "").trim();
  const originState = String(formData.get("originState") || "").trim();
  const destinationAddress = String(formData.get("destinationAddress") || "").trim();
  const destinationCity = String(formData.get("destinationCity") || "").trim();
  const destinationState = String(formData.get("destinationState") || "").trim();

  const broker = String(formData.get("broker") || "").trim();
  const rate = Number(formData.get("rate") || 0);
  const miles = Number(formData.get("miles") || 0);
  const deductions = Number(formData.get("deductions") || 0);
  const pickupDate = String(formData.get("pickupDate") || "");
  const deliveryDate = String(formData.get("deliveryDate") || "") || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!fleetId || !truckId || !originAddress || !destinationAddress || !broker || !rate || !miles || !pickupDate) {
    return { error: "Please fill in all required fields." };
  }

  const fleet = await prisma.fleet.findFirst({ where: { id: fleetId, companyId: user.companyId } });
  if (!fleet) return { error: "That fleet doesn't belong to your company." };

  const truck = await prisma.truck.findFirst({ where: { id: truckId, fleetId } });
  if (!truck) return { error: "That truck doesn't belong to the selected fleet." };

  // Dispatch fee is computed, never taken as raw input: it comes from the
  // creating user's own dispatch-fee percent (0 for owners/office/drivers
  // who don't carry one), matching the "auto-calculated, read-only" field
  // observed in the real app.
  const creator = await prisma.user.findUnique({ where: { id: user.id } });
  const dispatchFeePercent = Number(creator?.dispatchFeePercent ?? 0);
  const dispatchFeeAmount = +((rate * dispatchFeePercent) / 100).toFixed(2);

  await prisma.load.create({
    data: {
      fleetId,
      truckId,
      driverId,
      loadNumber,
      status,
      originAddress,
      originCity,
      originState,
      destinationAddress,
      destinationCity,
      destinationState,
      broker,
      rate,
      miles,
      dispatchFeePercent,
      dispatchFeeAmount,
      deductions,
      accessorials: extra.accessorials.length ? extra.accessorials : undefined,
      pickupDate: new Date(pickupDate),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      notes,
      createdById: user.id,
      stops: {
        create: extra.stops.map((s, i) => ({
          sequence: i,
          type: s.type,
          address: s.address,
          city: s.city,
          state: s.state,
        })),
      },
    },
  });

  revalidatePath("/loads");
  revalidatePath("/dashboard");
  return null;
}

export async function updateLoadStatus(loadId: string, status: LoadStatusValue) {
  const user = await requireUser();
  const load = await prisma.load.findFirst({
    where: { id: loadId, fleet: { companyId: user.companyId } },
  });
  if (!load) throw new Error("Load not found.");

  const allowed = nextManualStatuses(load.status as LoadStatusValue);
  if (!allowed.includes(status) && status !== load.status) {
    throw new Error(
      `Can't jump from ${load.status} to ${status} — move one step at a time (${LOAD_STATUS_FLOW.join(" → ")}).`
    );
  }

  await prisma.load.update({ where: { id: loadId }, data: { status } });
  revalidatePath("/loads");
  revalidatePath("/dashboard");
}
