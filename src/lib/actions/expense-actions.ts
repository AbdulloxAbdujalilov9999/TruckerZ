"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import type { ExpenseCategory } from "@/generated/prisma/client";

export type ActionState = { error?: string } | null;

export async function createExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const category = String(formData.get("category") || "") as ExpenseCategory;
  const amount = Number(formData.get("amount") || 0);
  const date = String(formData.get("date") || "");
  const truckId = String(formData.get("truckId") || "") || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!category || !amount || !date) {
    return { error: "Category, amount, and date are required." };
  }

  if (truckId) {
    const truck = await prisma.truck.findFirst({
      where: { id: truckId, fleet: { companyId: user.companyId } },
    });
    if (!truck) return { error: "That truck doesn't belong to your company." };
  }

  await prisma.expense.create({
    data: {
      companyId: user.companyId,
      truckId,
      category,
      amount,
      date: new Date(date),
      description,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return null;
}
