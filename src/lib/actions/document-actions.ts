"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { uploadToStorage } from "@/lib/supabase-storage";
import type { DocumentType } from "@/generated/prisma/client";

export type ActionState = { error?: string } | null;

export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const file = formData.get("file");
  const type = String(formData.get("type") || "OTHER") as DocumentType;
  const loadId = String(formData.get("loadId") || "") || null;

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { error: "File is larger than 15MB." };
  }

  if (loadId) {
    const load = await prisma.load.findFirst({
      where: { id: loadId, fleet: { companyId: user.companyId } },
    });
    if (!load) return { error: "That load doesn't belong to your company." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const storagePath = `${user.companyId}/${storedName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadToStorage(storagePath, buffer, file.type || "application/octet-stream");

  await prisma.document.create({
    data: {
      companyId: user.companyId,
      loadId,
      type,
      filePath: storagePath,
      uploadedById: user.id,
    },
  });

  revalidatePath("/documents");
  return null;
}
