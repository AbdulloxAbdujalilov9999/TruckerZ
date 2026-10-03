import { Users, AlertTriangle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { getExpiryStatus } from "@/lib/format";
import { DriverFileCard } from "./driver-file-card";

export default async function DriversPage() {
  const owner = await requireOwner();

  const drivers = await prisma.user.findMany({
    where: { companyId: owner.companyId, role: "DRIVER" },
    include: {
      truckAsDriver: { select: { unitNumber: true } },
      documentsOnFile: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  let expiredCount = 0;
  let expiringSoonCount = 0;
  for (const d of drivers) {
    for (const doc of d.documentsOnFile) {
      const status = getExpiryStatus(doc.expiresAt);
      if (status === "expired") expiredCount++;
      if (status === "expiring_soon") expiringSoonCount++;
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
        <p className="mt-1 text-sm text-muted">
          Each driver&apos;s papers in one file, with the date they run out.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Drivers" value={String(drivers.length)} icon={Users} />
        <StatCard
          label="Expiring Soon"
          value={String(expiringSoonCount)}
          hint="Within 30 days"
          icon={Clock}
          highlight={expiringSoonCount > 0}
        />
        <StatCard
          label="Expired"
          value={String(expiredCount)}
          hint="Needs attention"
          icon={AlertTriangle}
        />
      </div>

      <div className="mt-6">
        {drivers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No drivers yet"
            description="Add a driver from Settings to start building their file."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {drivers.map((driver) => (
              <DriverFileCard
                key={driver.id}
                driver={{
                  id: driver.id,
                  name: driver.name,
                  email: driver.email,
                  truckUnit: driver.truckAsDriver[0]?.unitNumber ?? null,
                }}
                documents={driver.documentsOnFile.map((doc) => ({
                  id: doc.id,
                  type: doc.type,
                  expiresAt: doc.expiresAt?.toISOString() ?? null,
                  createdAt: doc.createdAt.toISOString(),
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
