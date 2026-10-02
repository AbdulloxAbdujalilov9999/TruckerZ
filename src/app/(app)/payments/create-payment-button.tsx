"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { createPayment } from "@/lib/actions/payment-actions";
import type { Load, Truck } from "@/generated/prisma/client";

type LoadOption = Load & { truck: Truck };

export function CreatePaymentButton({ loads }: { loads: LoadOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadId, setLoadId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createPayment(null, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setLoadId("");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
      >
        <Plus className="h-4 w-4" />
        Create Payment
      </button>

      {open && (
        <Modal
          title="Create Payment"
          description="Select a load you created and enter payment details"
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border border-border bg-background p-3 text-sm text-muted">
              <span className="font-medium text-foreground">Note:</span> Financial fields (gross,
              fuel, driver fee) are auto-calculated and read-only. You can only edit date, status,
              and notes.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Select Load *</label>
              <select
                name="loadId"
                required
                value={loadId}
                onChange={(e) => setLoadId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose a load
                </option>
                {loads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.truck.unitNumber} · {l.broker} · {l.loadNumber ?? "no #"}
                  </option>
                ))}
              </select>
              {loads.length === 0 && (
                <p className="mt-1 text-xs text-muted">
                  No eligible loads — a load needs to be Delivered or further along, and not
                  already have a payment.
                </p>
              )}
            </div>

            {loadId && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Date *</label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <select
                      name="status"
                      defaultValue="PENDING"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="RECEIVED">Received</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !loadId}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
