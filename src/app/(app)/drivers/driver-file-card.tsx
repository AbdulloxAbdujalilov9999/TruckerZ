"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { uploadDriverDocument, deleteDriverDocument } from "@/lib/actions/driver-document-actions";
import { DOCUMENT_TYPE_LABELS, DRIVER_FILE_DOCUMENT_TYPES, formatDate, getExpiryStatus } from "@/lib/format";

type DriverDoc = {
  id: string;
  type: string;
  expiresAt: string | null;
  createdAt: string;
};

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const status = getExpiryStatus(expiresAt);
  if (status === "none") return null;
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
        <AlertTriangle className="h-3 w-3" /> Expired {formatDate(expiresAt!)}
      </span>
    );
  }
  if (status === "expiring_soon") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        <Clock className="h-3 w-3" /> Expires {formatDate(expiresAt!)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
      <CheckCircle2 className="h-3 w-3" /> Valid until {formatDate(expiresAt!)}
    </span>
  );
}

export function DriverFileCard({
  driver,
  documents,
}: {
  driver: { id: string; name: string; email: string; truckUnit: string | null };
  documents: DriverDoc[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("driverId", driver.id);
    const result = await uploadDriverDocument(null, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  function handleDelete(documentId: string) {
    startTransition(async () => {
      await deleteDriverDocument(documentId);
      router.refresh();
    });
  }

  const worstStatus = documents.reduce<"expired" | "expiring_soon" | "valid" | "none">((acc, d) => {
    const s = getExpiryStatus(d.expiresAt);
    if (s === "expired" || acc === "expired") return s === "expired" ? "expired" : acc;
    if (s === "expiring_soon" || acc === "expiring_soon") return "expiring_soon";
    return acc === "none" ? s : acc;
  }, "none");

  return (
    <div
      className={`rounded-xl border bg-surface p-5 ${
        worstStatus === "expired" ? "border-danger" : worstStatus === "expiring_soon" ? "border-warning" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{driver.name}</div>
          <div className="text-sm text-muted">{driver.email}</div>
          <div className="mt-1 text-xs text-muted">
            {driver.truckUnit ? `Truck ${driver.truckUnit}` : "No truck assigned"}
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium"
        >
          <Plus className="h-3 w-3" />
          Add Document
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {documents.length === 0 ? (
          <p className="text-sm text-muted">No documents on file yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[doc.type]}</div>
                <div className="mt-0.5">
                  <ExpiryBadge expiresAt={doc.expiresAt} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/files/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={isPending}
                  aria-label="Remove document"
                  className="text-muted hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <Modal title={`Add Document — ${driver.name}`} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <select
                name="type"
                required
                defaultValue="CDL"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {DRIVER_FILE_DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Expires on</label>
              <input
                name="expiresAt"
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted">Leave blank if this document doesn&apos;t expire.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">File *</label>
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
              >
                {loading ? "Uploading…" : "Add Document"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
