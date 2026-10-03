"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { submitFuelReceipt } from "@/lib/actions/fuel-receipt-actions";
import { US_STATES } from "@/lib/us-states";

export function SubmitFuelReceiptButton({ trucks }: { trucks: { id: string; unitNumber: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await submitFuelReceipt(null, formData);
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
        disabled={trucks.length === 0}
        className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        Submit Fuel Receipt
      </button>

      {open && (
        <Modal
          title="Submit Fuel Receipt"
          description="Date, state, and gallons — the IFTA basics, straight off the receipt."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Truck *</label>
                <select
                  name="truckId"
                  required
                  defaultValue={trucks[0]?.id}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">State *</label>
                <select
                  name="state"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    State
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Gallons *</label>
                <input
                  name="gallons"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount ($) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Receipt Photo</label>
              <input
                name="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                name="description"
                placeholder="Optional"
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
                {loading ? "Submitting…" : "Submit Receipt"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
