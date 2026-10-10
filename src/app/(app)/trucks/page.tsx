import { Truck as TruckIcon, CheckCircle2, Clock, XCircle, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { TruckStatusBadge } from "@/components/badge";
import { TRUCK_STATUS_LABELS } from "@/lib/format";
import { TrucksToolbar } from "./trucks-toolbar";
import { CreateTruckButton } from "./create-truck-button";

export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const fleets = await prisma.fleet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  const drivers = await prisma.user.findMany({
    where: { companyId: user.companyId, role: "DRIVER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const fleetFilter = params.fleet && params.fleet !== "all" ? params.fleet : undefined;
  const statusFilter = params.status && params.status !== "all" ? params.status : undefined;
  const search = params.q?.trim();

  const trucks = await prisma.truck.findMany({
    where: {
      fleet: { companyId: user.companyId, ...(fleetFilter ? { id: fleetFilter } : {}) },
      ...(statusFilter ? { status: statusFilter as "ACTIVE" | "IDLE" | "INACTIVE" } : {}),
      ...(search
        ? {
            OR: [
              { unitNumber: { contains: search, mode: "insensitive" } },
              { type: { contains: search, mode: "insensitive" } },
              { driver: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      driver: { select: { name: true } },
      secondaryDriver: { select: { name: true } },
      fleet: { select: { name: true } },
      loads: {
        where: { status: { in: ["BOOKED", "IN_TRANSIT"] } },
        select: { id: true },
      },
    },
    orderBy: { unitNumber: "asc" },
  });

  const allCompanyTrucks = await prisma.truck.findMany({
    where: { fleet: { companyId: user.companyId } },
    select: {
      status: true,
      loads: { where: { status: { in: ["BOOKED", "IN_TRANSIT"] } }, select: { id: true } },
    },
  });

  const total = allCompanyTrucks.length;
  const active = allCompanyTrucks.filter((t) => t.status === "ACTIVE").length;
  const idle = allCompanyTrucks.filter((t) => t.status === "IDLE").length;
  const inactive = allCompanyTrucks.filter((t) => t.status === "INACTIVE").length;
  const runningLoad = allCompanyTrucks.filter((t) => t.loads.length > 0).length;
  const utilization = total > 0 ? (runningLoad / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trucks</h1>
          <p className="mt-1 text-sm text-muted">Manage your fleet trucks</p>
        </div>
        <CreateTruckButton fleets={fleets} drivers={drivers} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Trucks"
          value={String(total)}
          hint={`${active} active`}
          icon={TruckIcon}
        />
        <StatCard
          label="Active Trucks"
          value={String(active)}
          hint={total ? `${((active / total) * 100).toFixed(0)}% of total` : "0% of total"}
          icon={CheckCircle2}
        />
        <StatCard
          label="Average Utilization"
          value={`${utilization.toFixed(1)}%`}
          hint="Trucks currently on a load"
          icon={Gauge}
        />
        <StatCard label="Idle Trucks" value={String(idle)} hint="Available, no load" icon={Clock} />
        <StatCard
          label="Inactive Trucks"
          value={String(inactive)}
          hint="Out of service"
          icon={XCircle}
        />
      </div>

      <div className="mt-6">
        <TrucksToolbar fleets={fleets} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {trucks.length === 0 ? (
          <EmptyState
            icon={TruckIcon}
            title="No trucks found"
            description="Get started by creating your first truck."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Fleet</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Trailer</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Running Load</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {truck.unitNumber}
                    {truck.vin && <div className="text-xs font-normal text-muted">VIN {truck.vin}</div>}
                  </td>
                  <td className="px-5 py-3 text-muted">{truck.fleet.name}</td>
                  <td className="px-5 py-3 text-muted">{truck.type ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{truck.trailerNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">
                    {truck.driver?.name ?? "Unassigned"}
                    {truck.secondaryDriver && (
                      <div className="text-xs">+ {truck.secondaryDriver.name}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <TruckStatusBadge
                      status={truck.status}
                      label={TRUCK_STATUS_LABELS[truck.status]}
                    />
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {truck.loads.length > 0 ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
