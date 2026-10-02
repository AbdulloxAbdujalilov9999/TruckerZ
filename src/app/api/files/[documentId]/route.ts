import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFromStorage } from "@/lib/supabase-storage";

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
    const buffer = await downloadFromStorage(doc.filePath);
    const filename = doc.filePath.split("/").pop()!.replace(/^[0-9a-f-]{36}-/, "");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing in storage." }, { status: 404 });
  }
}
