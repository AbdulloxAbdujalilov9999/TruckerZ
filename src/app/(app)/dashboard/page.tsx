import { DollarSign, Receipt, TrendingUp, Clock, Package, Truck, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDashboardData, getDetailedAnalytics, getDriverDashboardData } from "@/lib/dashboard-data";
import { DashboardFleetFilter } from "./fleet-filter";
import { DetailRangeFilter } from "./detail-range-filter";
import {
  RevenueTrendChart,
  RpmTrendChart,
  LoadsByStatusChart,
  TruckStatusPie,
  PaymentStatusPie,
  MiniBarChart,
} from "./dashboard-charts";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  // Drivers never see company money — just their own loads and miles.
  if (user.role === "DRIVER") {
    const driverData = await getDriverDashboardData(user.companyId, user.id);
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Welcome, {user.name?.split(" ")[0]}.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Your Loads" value={String(driverData.totalLoads)} icon={Package} />
          <StatCard label="Active Now" value={String(driverData.activeLoads)} hint="Booked or in transit" icon={Truck} />
          <StatCard label="Total Miles" value={driverData.totalMiles.toLocaleString()} icon={Gauge} />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold">Your Loads by Status</h3>
          <p className="text-xs text-muted">Across everything assigned to you</p>
          <div className="mt-2">
            <LoadsByStatusChart data={driverData.loadsByStatus} />
          </div>
        </div>
      </div>
    );
  }

  const fleets = await prisma.fleet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });
  const fleetId = params.fleet && params.fleet !== "all" ? params.fleet : undefined;

  // Office staff handle loads and paperwork without seeing payments,
  // expenses, or what anyone earns — same operational data, no money.
  const canSeeFinancials = user.role === "OWNER" || user.role === "DISPATCHER";

  const detailDays = params.detailRange ? Number(params.detailRange) : 30;
  const [data, detail] = await Promise.all([
    getDashboardData(user.companyId, fleetId),
    getDetailedAnalytics(user.companyId, fleetId, detailDays),
  ]);
  const { stats } = data;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Welcome, {user.name?.split(" ")[0]}.</p>
        </div>
        <DashboardFleetFilter fleets={fleets} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {canSeeFinancials && (
          <>
            <StatCard
              label="Projected Revenue"
              value={formatCurrency(stats.projectedRevenue)}
              hint="Total expected revenue"
              icon={DollarSign}
            />
            <StatCard
              label="Revenue Received"
              value={formatCurrency(stats.revenueReceived)}
              hint="All time"
              icon={DollarSign}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(stats.totalExpenses)}
              hint="All recorded expenses"
              icon={Receipt}
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(stats.netProfit)}
              hint="After all expenses"
              icon={TrendingUp}
              highlight
            />
            <StatCard
              label="Pending Payments"
              value={formatCurrency(stats.pendingAmount)}
              hint={`${stats.pendingCount} payments pending`}
              icon={Clock}
            />
          </>
        )}
        <StatCard
          label="Total Loads"
          value={String(stats.totalLoads)}
          hint={`${stats.totalMiles.toLocaleString()} miles`}
          icon={Package}
        />
        <StatCard
          label="Total Trucks"
          value={String(stats.totalTrucks)}
          hint={`${stats.activeTrucks} active`}
          icon={Truck}
        />
        {canSeeFinancials && (
          <StatCard
            label="Average Rate Per Mile"
            value={`${formatCurrency(stats.avgRatePerMile)}/mi`}
            hint={`${stats.totalMiles.toLocaleString()} total miles`}
            icon={Gauge}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {canSeeFinancials && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">Revenue Trend</h3>
            <p className="text-xs text-muted">Monthly revenue for the past 6 months. This month is shown so far.</p>
            <div className="mt-2">
              <RevenueTrendChart data={data.revenueTrend} />
            </div>
          </div>
        )}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold">Loads by Status</h3>
          <p className="text-xs text-muted">Current load distribution across workflow stages</p>
          <div className="mt-2">
            <LoadsByStatusChart data={data.loadsByStatus} />
          </div>
        </div>
        {canSeeFinancials && (
          <>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">Rate Per Mile Trend</h3>
              <p className="text-xs text-muted">Average RPM performance over the past 6 months</p>
              <div className="mt-2">
                <RpmTrendChart data={data.rpmTrend} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">Recent Payments</h3>
              <p className="text-xs text-muted">Latest payment transactions</p>
              <div className="mt-3">
                {data.recentPayments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">No recent payments</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recentPayments.map((p, i) => (
                      <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-muted">{formatDate(p.date)}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <span
                          className={
                            p.status === "RECEIVED" ? "text-success text-xs" : "text-warning text-xs"
                          }
                        >
                          {p.status === "RECEIVED" ? "Received" : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Detailed Analytics</h2>
        <DetailRangeFilter />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold">Truck Status</h3>
          <p className="text-xs text-muted">Fleet distribution</p>
          <TruckStatusPie data={detail.truckStatus} />
        </div>
        {canSeeFinancials && (
          <>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">Payment Status</h3>
              <p className="text-xs text-muted">Pending vs Received</p>
              <PaymentStatusPie data={detail.paymentStatus} />
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Monthly Payment Trend</h3>
                <span className={detail.paymentTrendChange >= 0 ? "text-xs text-success" : "text-xs text-danger"}>
                  {detail.paymentTrendChange >= 0 ? "+" : ""}
                  {detail.paymentTrendChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted">Received payments by period</p>
              <MiniBarChart data={detail.monthlyPaymentTrend} dataKey="amount" />
            </div>
          </>
        )}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Loads Trend</h3>
            <span className={detail.loadsTrendChange >= 0 ? "text-xs text-success" : "text-xs text-danger"}>
              {detail.loadsTrendChange >= 0 ? "+" : ""}
              {detail.loadsTrendChange.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted">Selected period</p>
          <MiniBarChart data={detail.loadsTrend} dataKey="loads" />
        </div>
      </div>
    </div>
  );
}
