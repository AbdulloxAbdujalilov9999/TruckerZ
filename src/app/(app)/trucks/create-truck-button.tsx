"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { createTruck } from "@/lib/actions/truck-actions";
import type { Fleet } from "@/generated/prisma/client";

export function CreateTruckButton({
  fleets,
  drivers,
}: {
  fleets: Fleet[];
  drivers: { id: string; name: string }[];
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
    const result = await createTruck(null, formData);
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
        Create Truck
      </button>

      {open && (
        <Modal
          title="Create Truck"
          description="Add a truck to your fleet."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Fleet *</label>
              <select
                name="fleetId"
                required
                defaultValue={fleets[0]?.id}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {fleets.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Unit Number *</label>
                <input
                  name="unitNumber"
                  required
                  placeholder="FC-001"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <input
                  name="type"
                  placeholder="2022 Peterbilt"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">VIN</label>
                <input
                  name="vin"
                  placeholder="1XPBD49X1ND764507"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Trailer #</label>
                <input
                  name="trailerNumber"
                  placeholder="777"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  name="status"
                  defaultValue="ACTIVE"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="IDLE">Idle</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Driver</label>
                <select
                  name="driverId"
                  defaultValue=""
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                disabled={loading}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Truck"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
