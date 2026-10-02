"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/scope";
import type { DriverPayType, Role } from "@/generated/prisma/client";

export type ActionState = { error?: string } | null;

export async function createFleet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireOwner();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Fleet name is required." };

  await prisma.fleet.create({ data: { name, companyId: owner.companyId } });
  revalidatePath("/settings");
  return null;
}

export async function createTeamMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireOwner();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;
  const dispatchFeePercent = formData.get("dispatchFeePercent")
    ? Number(formData.get("dispatchFeePercent"))
    : null;
  const driverPayType = (String(formData.get("driverPayType") || "") || null) as DriverPayType | null;
  const driverPayRate = formData.get("driverPayRate") ? Number(formData.get("driverPayRate")) : null;

  if (!name || !email || !password || !role) {
    return { error: "Name, email, password, and role are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      companyId: owner.companyId,
      dispatchFeePercent: role === "DISPATCHER" ? dispatchFeePercent : null,
      driverPayType: role === "DRIVER" ? driverPayType : null,
      driverPayRate: role === "DRIVER" ? driverPayRate : null,
    },
  });

  revalidatePath("/settings");
  return null;
}
