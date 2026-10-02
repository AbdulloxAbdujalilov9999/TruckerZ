"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type SignupState = { error?: string } | null;

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const companyName = String(formData.get("companyName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!companyName || !name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: companyName },
    });
    await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
        companyId: company.id,
      },
    });
    await tx.fleet.create({
      data: { name: "Main Fleet", companyId: company.id },
    });
  });

  return null;
}
