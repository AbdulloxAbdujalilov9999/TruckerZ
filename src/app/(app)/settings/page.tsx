import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/scope";
import { CreateFleetButton } from "./create-fleet-button";
import { CreateTeamMemberButton } from "./create-team-member-button";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  DISPATCHER: "Dispatcher",
  OFFICE: "Office",
  DRIVER: "Driver",
};

export default async function SettingsPage() {
  const owner = await requireOwner();

  const [fleets, users] = await Promise.all([
    prisma.fleet.findMany({
      where: { companyId: owner.companyId },
      include: { _count: { select: { trucks: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId: owner.companyId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your fleets and team.</p>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fleets</h2>
          <CreateFleetButton />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Trucks</th>
              </tr>
            </thead>
            <tbody>
              {fleets.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{f.name}</td>
                  <td className="px-5 py-3 text-muted">{f._count.trucks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team</h2>
          <CreateTeamMemberButton />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Pay / Fee</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3 text-muted">{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3 text-muted">
                    {u.role === "DISPATCHER" && u.dispatchFeePercent != null
                      ? `${u.dispatchFeePercent}% dispatch fee`
                      : u.role === "DRIVER" && u.driverPayType
                        ? `${u.driverPayType.toLowerCase().replace("_", " ")}${
                            u.driverPayRate != null ? ` · ${u.driverPayRate}` : ""
                          }`
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
