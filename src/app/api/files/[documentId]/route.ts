import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { documentId } = await params;
  const doc = await prisma.document.findFirst({
    where: { id: documentId, companyId: session.user.companyId },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const filePath = path.join(STORAGE_ROOT, doc.companyId, doc.filePath);
    const buffer = await readFile(filePath);
    const filename = doc.filePath.replace(/^[0-9a-f-]{36}-/, "");
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk." }, { status: 404 });
  }
}
