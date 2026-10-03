"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/scope";
import { uploadToStorage } from "@/lib/supabase-storage";
import type { DocumentType } from "@/generated/prisma/client";

export type ActionState = { error?: string } | null;

export async function uploadDriverDocument(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owner = await requireOwner();

  const driverId = String(formData.get("driverId") || "");
  const type = String(formData.get("type") || "OTHER") as DocumentType;
  const expiresAt = String(formData.get("expiresAt") || "") || null;
  const file = formData.get("file");

  if (!driverId) return { error: "Missing driver." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { error: "File is larger than 15MB." };
  }

  const driver = await prisma.user.findFirst({
    where: { id: driverId, companyId: owner.companyId, role: "DRIVER" },
  });
  if (!driver) return { error: "That driver doesn't belong to your company." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const storagePath = `${owner.companyId}/drivers/${driverId}/${storedName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadToStorage(storagePath, buffer, file.type || "application/octet-stream");

  await prisma.document.create({
    data: {
      companyId: owner.companyId,
      userId: driverId,
      type,
      filePath: storagePath,
      uploadedById: owner.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  revalidatePath("/drivers");
  return null;
}

export async function deleteDriverDocument(documentId: string) {
  const owner = await requireOwner();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, companyId: owner.companyId, userId: { not: null } },
  });
  if (!doc) throw new Error("Document not found.");

  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/drivers");
}
