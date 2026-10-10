"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { createTeamMember } from "@/lib/actions/settings-actions";

export function CreateTeamMemberButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("DISPATCHER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTeamMember(null, formData);
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
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Add Team Member
      </button>

      {open && (
        <Modal
          title="Add Team Member"
          description="Creates a login directly. No email invite yet — share the password with them yourself."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input name="name" required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role *</label>
                <select
                  name="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="OFFICE">Office</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Temporary Password *</label>
                <input
                  name="password"
                  type="text"
                  required
                  minLength={8}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="Optional"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {role === "DISPATCHER" && (
              <div>
                <label className="mb-1 block text-sm font-medium">Dispatch Fee (%)</label>
                <input
                  name="dispatchFeePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue="5"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted">
                  Their cut of the load rate on every load they create.
                </p>
              </div>
            )}

            {role === "DRIVER" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Pay Type</label>
                  <select
                    name="driverPayType"
                    defaultValue="PER_MILE"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="PERCENTAGE">Percentage of load</option>
                    <option value="PER_MILE">Per mile</option>
                    <option value="SALARY">Salary</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Rate</label>
                  <input
                    name="driverPayRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 0.60"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

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
                {loading ? "Creating…" : "Create Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
