"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import type { DocumentType } from "@/generated/prisma/client";

export type ActionState = { error?: string } | null;

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const file = formData.get("file");
  const type = String(formData.get("type") || "OTHER") as DocumentType;
  const loadId = String(formData.get("loadId") || "") || null;

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  // Dev-only guard: keep uploads reasonable on local disk storage.
  if (file.size > 15 * 1024 * 1024) {
    return { error: "File is larger than 15MB." };
  }

  if (loadId) {
    const load = await prisma.load.findFirst({
      where: { id: loadId, fleet: { companyId: user.companyId } },
    });
    if (!load) return { error: "That load doesn't belong to your company." };
  }

  const companyDir = path.join(STORAGE_ROOT, user.companyId);
  await mkdir(companyDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(companyDir, storedName), buffer);

  await prisma.document.create({
    data: {
      companyId: user.companyId,
      loadId,
      type,
      filePath: storedName,
      uploadedById: user.id,
    },
  });

  revalidatePath("/documents");
  return null;
}
