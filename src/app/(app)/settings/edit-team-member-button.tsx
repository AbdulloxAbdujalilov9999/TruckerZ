"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { updateTeamMember } from "@/lib/actions/settings-actions";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  dispatchFeePercent: string | number | null;
  driverPayType: string | null;
  driverPayRate: string | number | null;
};

export function EditTeamMemberButton({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("userId", member.id);
    const result = await updateTeamMember(null, formData);
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
        aria-label={`Edit ${member.name}`}
        className="flex items-center gap-1 text-xs font-medium text-brand underline-offset-2 hover:underline"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>

      {open && (
        <Modal
          title={`Edit ${member.name}`}
          description={isSelf ? "This is your own account." : "Change their email, role, pay, or reset their password."}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={member.name}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role *</label>
                {isSelf ? (
                  <>
                    <input
                      disabled
                      value="Owner"
                      className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-muted"
                    />
                    <input type="hidden" name="role" value="OWNER" />
                  </>
                ) : (
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
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={member.email}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">New Password</label>
                <input
                  name="newPassword"
                  type="text"
                  minLength={8}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={member.phone ?? ""}
                placeholder="Optional"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {role === "DISPATCHER" && !isSelf && (
              <div>
                <label className="mb-1 block text-sm font-medium">Dispatch Fee (%)</label>
                <input
                  name="dispatchFeePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={member.dispatchFeePercent != null ? String(member.dispatchFeePercent) : "5"}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            {role === "DRIVER" && !isSelf && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Pay Type</label>
                  <select
                    name="driverPayType"
                    defaultValue={member.driverPayType ?? "PER_MILE"}
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
                    defaultValue={member.driverPayRate != null ? String(member.driverPayRate) : ""}
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
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
