"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { createLoad } from "@/lib/actions/load-actions";
import type { Fleet, Truck } from "@/generated/prisma/client";

type FleetWithTrucks = Fleet & { trucks: Truck[] };
type StopDraft = { type: "PICKUP" | "STOP" | "DELIVERY"; address: string; city: string; state: string };
type AccessorialDraft = { label: string; amount: string };

const ACCESSORIAL_PRESETS = ["Detention", "Lumper", "Layover", "TONU", "Fuel Surcharge"];

export function CreateLoadButton({
  fleets,
  drivers,
}: {
  fleets: FleetWithTrucks[];
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fleetId, setFleetId] = useState(fleets[0]?.id ?? "");
  const [stops, setStops] = useState<StopDraft[]>([]);
  const [showAccessorials, setShowAccessorials] = useState(false);
  const [accessorials, setAccessorials] = useState<AccessorialDraft[]>([]);

  const trucksForFleet = useMemo(
    () => fleets.find((f) => f.id === fleetId)?.trucks ?? [],
    [fleets, fleetId]
  );

  function addStop() {
    setStops((s) => [...s, { type: "STOP", address: "", city: "", state: "" }]);
  }
  function updateStop(i: number, patch: Partial<StopDraft>) {
    setStops((s) => s.map((stop, idx) => (idx === i ? { ...stop, ...patch } : stop)));
  }
  function removeStop(i: number) {
    setStops((s) => s.filter((_, idx) => idx !== i));
  }

  function toggleAccessorial(label: string) {
    setAccessorials((a) =>
      a.some((x) => x.label === label)
        ? a.filter((x) => x.label !== label)
        : [...a, { label, amount: "0" }]
    );
  }
  function updateAccessorialAmount(label: string, amount: string) {
    setAccessorials((a) => a.map((x) => (x.label === label ? { ...x, amount } : x)));
  }

  function resetAndClose() {
    setOpen(false);
    setStops([]);
    setAccessorials([]);
    setShowAccessorials(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createLoad(null, formData, {
      stops: stops.filter((s) => s.address && s.city),
      accessorials: accessorials
        .filter((a) => Number(a.amount) > 0)
        .map((a) => ({ label: a.label, amount: Number(a.amount) })),
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    resetAndClose();
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        disabled
        title="AI rate-con extraction isn't wired up in this build yet"
        className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        Create with AI
      </button>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
      >
        <Plus className="h-4 w-4" />
        Create Load
      </button>

      {open && (
        <Modal title="Create New Load" description="Create a new load assignment for your fleet." onClose={resetAndClose}>
          <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Fleet *</label>
                <select
                  name="fleetId"
                  required
                  value={fleetId}
                  onChange={(e) => setFleetId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {fleets.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Truck *</label>
                <select
                  name="truckId"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select truck
                  </option>
                  {trucksForFleet.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="mb-1 block text-sm font-medium">Load Number</label>
                <input
                  name="loadNumber"
                  placeholder="Optional"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue="BOOKED"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="BOOKED">Booked</option>
              </select>
              <p className="mt-1 text-xs text-muted">New loads always start Booked.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Origin *</label>
                <input
                  name="originAddress"
                  required
                  placeholder="Full Address"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Destination *</label>
                <input
                  name="destinationAddress"
                  required
                  placeholder="Full Address"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                <input
                  name="originCity"
                  placeholder="City"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  name="originState"
                  placeholder="ST"
                  maxLength={2}
                  className="w-16 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase"
                />
              </div>
              <div className="flex gap-2">
                <input
                  name="destinationCity"
                  placeholder="City"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  name="destinationState"
                  placeholder="ST"
                  maxLength={2}
                  className="w-16 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Broker *</label>
              <input
                name="broker"
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Rate ($) *</label>
                <input
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Miles *</label>
                <input
                  name="miles"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Dispatch Fee</label>
                <input
                  disabled
                  placeholder="Auto-calculated from your dispatch rate"
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-muted"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Deductions ($)</label>
                <input
                  name="deductions"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-md border border-border">
              <button
                type="button"
                onClick={() => setShowAccessorials((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium"
              >
                <input type="checkbox" readOnly checked={showAccessorials} className="pointer-events-none" />
                Accessorials
              </button>
              {showAccessorials && (
                <div className="space-y-2 border-t border-border p-3">
                  {ACCESSORIAL_PRESETS.map((label) => {
                    const active = accessorials.find((a) => a.label === label);
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!active}
                          onChange={() => toggleAccessorial(label)}
                        />
                        <span className="w-32 text-sm">{label}</span>
                        {active && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={active.amount}
                            onChange={(e) => updateAccessorialAmount(label, e.target.value)}
                            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Pickup Date *</label>
                <input
                  name="pickupDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Delivery Date</label>
                <input
                  name="deliveryDate"
                  type="date"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Optional notes..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Stops</label>
                <button
                  type="button"
                  onClick={addStop}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Add stop
                </button>
              </div>
              {stops.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted">
                  No stops added.
                </p>
              ) : (
                <div className="space-y-2">
                  {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-border p-2">
                      <select
                        value={stop.type}
                        onChange={(e) => updateStop(i, { type: e.target.value as StopDraft["type"] })}
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                      >
                        <option value="PICKUP">Pickup</option>
                        <option value="STOP">Stop</option>
                        <option value="DELIVERY">Delivery</option>
                      </select>
                      <input
                        placeholder="Address"
                        value={stop.address}
                        onChange={(e) => updateStop(i, { address: e.target.value })}
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <input
                        placeholder="City"
                        value={stop.city}
                        onChange={(e) => updateStop(i, { city: e.target.value })}
                        className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                      />
                      <input
                        placeholder="ST"
                        maxLength={2}
                        value={stop.state}
                        onChange={(e) => updateStop(i, { state: e.target.value })}
                        className="w-12 rounded-md border border-border bg-background px-2 py-1.5 text-xs uppercase"
                      />
                      <button type="button" onClick={() => removeStop(i)} className="text-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Load"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
