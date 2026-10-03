import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { EmptyState } from "@/components/empty-state";
import { formatDate, DOCUMENT_TYPE_LABELS } from "@/lib/format";
import { UploadDocumentButton } from "./upload-document-button";

export default async function DocumentsPage() {
  const user = await requireUser();

  // Driver-file paperwork (CDL, medical card, etc.) lives on /drivers instead.
  const [documents, loads] = await Promise.all([
    prisma.document.findMany({
      where: { companyId: user.companyId, userId: null },
      include: { uploadedBy: { select: { name: true } }, load: { select: { loadNumber: true, broker: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.load.findMany({
      where: { fleet: { companyId: user.companyId } },
      select: { id: true, loadNumber: true, broker: true },
      orderBy: { pickupDate: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted">COI, W9, rate confirmations, BOLs, and PODs — kept for good.</p>
        </div>
        <UploadDocumentButton loads={loads} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" description="Upload your first document to get started." />
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Linked Load</th>
                <th className="px-5 py-3 font-medium">Uploaded By</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{DOCUMENT_TYPE_LABELS[d.type]}</td>
                  <td className="px-5 py-3 text-muted">
                    {d.load ? `${d.load.broker} · ${d.load.loadNumber ?? "no #"}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">{d.uploadedBy.name}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(d.createdAt)}</td>
                  <td className="px-5 py-3">
                    <a
                      href={`/api/files/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
