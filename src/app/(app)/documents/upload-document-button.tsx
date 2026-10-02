"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { uploadDocument } from "@/lib/actions/document-actions";

export function UploadDocumentButton({
  loads,
}: {
  loads: { id: string; loadNumber: string | null; broker: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await uploadDocument(null, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
      >
        <Plus className="h-4 w-4" />
        Upload Document
      </button>

      {open && (
        <Modal title="Upload Document" description="Stored on this server's local disk for now." onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <select
                name="type"
                required
                defaultValue="OTHER"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="COI">Certificate of Insurance</option>
                <option value="W9">W-9</option>
                <option value="RATE_CON">Rate Confirmation</option>
                <option value="BOL">Bill of Lading</option>
                <option value="POD">Proof of Delivery</option>
                <option value="RECEIPT">Receipt</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Linked Load</label>
              <select
                name="loadId"
                defaultValue=""
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Not linked to a load</option>
                {loads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.broker} · {l.loadNumber ?? "no #"}
                  </option>
                ))}
              </select>
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
              <p className="mt-1 text-xs text-muted">PDF or image, up to 15MB.</p>
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
                {loading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
