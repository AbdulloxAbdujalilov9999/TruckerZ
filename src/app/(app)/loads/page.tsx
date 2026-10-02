import { Package, Wallet, Clock, BookOpen, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { LoadStatusBadge } from "@/components/badge";
import { formatCurrency, formatDate, LOAD_STATUS_LABELS } from "@/lib/format";
import { resolveDateRange } from "@/lib/date-range";
import { LoadsToolbar } from "./loads-toolbar";
import { CreateLoadButton } from "./create-load-button";
import { LoadStatusControl } from "./load-status-control";

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const isDriver = user.role === "DRIVER";

  const fleets = await prisma.fleet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
    include: { trucks: { orderBy: { unitNumber: "asc" } } },
  });
  const drivers = await prisma.user.findMany({
    where: { companyId: user.companyId, role: "DRIVER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const fleetFilter = params.fleet && params.fleet !== "all" ? params.fleet : undefined;
  const statusFilter = params.status && params.status !== "all" ? params.status : undefined;
  const search = params.q?.trim();
  const range = resolveDateRange({ range: params.range, from: params.from, to: params.to });

  // A driver only ever sees their own loads — never the fleet's full board.
  const whereBase = {
    fleet: { companyId: user.companyId, ...(fleetFilter ? { id: fleetFilter } : {}) },
    ...(isDriver ? { driverId: user.id } : {}),
  };

  const loads = await prisma.load.findMany({
    where: {
      ...whereBase,
      ...(statusFilter ? { status: statusFilter as never } : {}),
      ...(range ? { pickupDate: { gte: range.from, lte: range.to } } : {}),
      ...(search
        ? {
            OR: [
              { loadNumber: { contains: search, mode: "insensitive" } },
              { broker: { contains: search, mode: "insensitive" } },
              { originCity: { contains: search, mode: "insensitive" } },
              { destinationCity: { contains: search, mode: "insensitive" } },
              { truck: { unitNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { truck: true, driver: { select: { name: true } }, payment: true },
    orderBy: { pickupDate: "desc" },
  });

  // Stat cards computed over the company (fleet-filtered), independent of status/search filters.
  const statScopeLoads = await prisma.load.findMany({
    where: {
      ...whereBase,
      ...(range ? { pickupDate: { gte: range.from, lte: range.to } } : {}),
    },
    select: { rate: true, deductions: true, miles: true, status: true, pickupDate: true },
  });

  const unpaid = statScopeLoads.filter((l) => l.status !== "PAID");
  const outstanding = unpaid.reduce((sum, l) => sum + Number(l.rate) - Number(l.deductions), 0);
  const oldestUnpaid = unpaid.length
    ? unpaid.reduce((a, b) => (a.pickupDate < b.pickupDate ? a : b)).pickupDate
    : null;
  const onBoard = statScopeLoads.filter((l) => l.status === "BOOKED");
  const onBoardAmount = onBoard.reduce((sum, l) => sum + Number(l.rate), 0);
  const revenue = statScopeLoads.reduce((sum, l) => sum + Number(l.rate), 0);
  const totalMiles = statScopeLoads.reduce((sum, l) => sum + Number(l.miles), 0);
  const ratePerMile = totalMiles > 0 ? revenue / totalMiles : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loads</h1>
          <p className="mt-1 text-sm text-muted">
            {isDriver ? "Your assigned loads" : "Create and manage load assignments and tracking"}
          </p>
        </div>
        {!isDriver && <CreateLoadButton fleets={fleets} drivers={drivers} />}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {isDriver ? (
          <>
            <StatCard label="Your Loads" value={String(statScopeLoads.length)} icon={Package} />
            <StatCard label="On the Board" value={String(onBoard.length)} icon={BookOpen} />
            <StatCard label="Total Miles" value={totalMiles.toLocaleString()} icon={TrendingUp} />
          </>
        ) : (
          <>
            <StatCard
              label="Outstanding"
              value={formatCurrency(outstanding)}
              hint={`${unpaid.length} loads not yet paid`}
              icon={Wallet}
            />
            <StatCard
              label="Oldest Unpaid"
              value={oldestUnpaid ? formatDate(oldestUnpaid) : "—"}
              hint={oldestUnpaid ? undefined : "Nothing outstanding"}
              icon={Clock}
            />
            <StatCard
              label="On the Board"
              value={String(onBoard.length)}
              hint={`${formatCurrency(onBoardAmount)} booked`}
              icon={BookOpen}
              highlight
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(revenue)}
              hint={`${statScopeLoads.length} loads in this period`}
              icon={Package}
            />
            <StatCard
              label="Rate / mile"
              value={`${formatCurrency(ratePerMile)}/mi`}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="mt-6">
        <LoadsToolbar fleets={fleets} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        {loads.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No loads found"
            description="No loads have been created yet. Create one to get started."
          />
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Load</th>
                <th className="px-5 py-3 font-medium">Truck</th>
                <th className="px-5 py-3 font-medium">Broker</th>
                <th className="px-5 py-3 font-medium">Lane</th>
                {!isDriver && <th className="px-5 py-3 font-medium">Rate</th>}
                <th className="px-5 py-3 font-medium">Miles</th>
                <th className="px-5 py-3 font-medium">Pickup</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-5 py-3 font-medium">{load.loadNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{load.truck.unitNumber}</td>
                  <td className="px-5 py-3 text-muted">{load.broker}</td>
                  <td className="px-5 py-3 text-muted">
                    {load.originCity}, {load.originState} → {load.destinationCity},{" "}
                    {load.destinationState}
                  </td>
                  {!isDriver && <td className="px-5 py-3">{formatCurrency(load.rate)}</td>}
                  <td className="px-5 py-3 text-muted">{Number(load.miles).toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(load.pickupDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <LoadStatusBadge status={load.status} label={LOAD_STATUS_LABELS[load.status]} />
                      <LoadStatusControl loadId={load.id} currentStatus={load.status} />
                    </div>
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
