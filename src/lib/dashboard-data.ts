import { prisma } from "@/lib/prisma";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthsBack(n: number): { start: Date; label: string; key: string }[] {
  const now = new Date();
  const out: { start: Date; label: string; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ start: d, label: MONTH_LABELS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  return out;
}

export async function getDashboardData(companyId: string, fleetId?: string) {
  const fleetScope = { companyId, ...(fleetId ? { id: fleetId } : {}) };

  const [loads, trucks, payments, expenses] = await Promise.all([
    prisma.load.findMany({
      where: { fleet: fleetScope },
      select: { rate: true, miles: true, status: true, pickupDate: true },
    }),
    prisma.truck.findMany({
      where: { fleet: fleetScope },
      select: { status: true },
    }),
    prisma.payment.findMany({
      where: { load: { fleet: fleetScope } },
      select: { grossAmount: true, status: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      where: { companyId, ...(fleetId ? { truck: { fleetId } } : {}) },
      select: { amount: true },
    }),
  ]);

  const projectedRevenue = loads.reduce((s, l) => s + Number(l.rate), 0);
  const revenueReceived = payments
    .filter((p) => p.status === "RECEIVED")
    .reduce((s, p) => s + Number(p.grossAmount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = revenueReceived - totalExpenses;
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const pendingAmount = pendingPayments.reduce((s, p) => s + Number(p.grossAmount), 0);
  const totalMiles = loads.reduce((s, l) => s + Number(l.miles), 0);
  const avgRatePerMile = totalMiles > 0 ? projectedRevenue / totalMiles : 0;
  const activeTrucks = trucks.filter((t) => t.status === "ACTIVE").length;

  const months = monthsBack(6);
  const revenueTrend = months.map((m) => {
    const monthLoads = loads.filter(
      (l) => l.pickupDate.getFullYear() === m.start.getFullYear() && l.pickupDate.getMonth() === m.start.getMonth()
    );
    return { month: m.label, revenue: monthLoads.reduce((s, l) => s + Number(l.rate), 0) };
  });

  const rpmTrend = months.map((m) => {
    const monthLoads = loads.filter(
      (l) => l.pickupDate.getFullYear() === m.start.getFullYear() && l.pickupDate.getMonth() === m.start.getMonth()
    );
    const miles = monthLoads.reduce((s, l) => s + Number(l.miles), 0);
    const revenue = monthLoads.reduce((s, l) => s + Number(l.rate), 0);
    return { month: m.label, rpm: miles > 0 ? +(revenue / miles).toFixed(2) : 0 };
  });

  const statusOrder = ["BOOKED", "IN_TRANSIT", "DELIVERED", "INVOICED", "PAID"] as const;
  const statusLabels: Record<string, string> = {
    BOOKED: "Booked",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    INVOICED: "Invoiced",
    PAID: "Paid",
  };
  const loadsByStatus = statusOrder.map((s) => ({
    status: statusLabels[s],
    count: loads.filter((l) => l.status === s).length,
  }));

  const recentPayments = payments.slice(0, 5).map((p) => ({
    amount: Number(p.grossAmount),
    status: p.status,
    date: p.date.toISOString(),
  }));

  return {
    stats: {
      projectedRevenue,
      revenueReceived,
      totalExpenses,
      netProfit,
      pendingAmount,
      pendingCount: pendingPayments.length,
      totalLoads: loads.length,
      totalMiles,
      totalTrucks: trucks.length,
      activeTrucks,
      avgRatePerMile,
    },
    revenueTrend,
    rpmTrend,
    loadsByStatus,
    recentPayments,
  };
}

export async function getDriverDashboardData(companyId: string, driverId: string) {
  const loads = await prisma.load.findMany({
    where: { driverId, fleet: { companyId } },
    select: { status: true, miles: true, pickupDate: true },
  });

  const statusOrder = ["BOOKED", "IN_TRANSIT", "DELIVERED", "INVOICED", "PAID"] as const;
  const statusLabels: Record<string, string> = {
    BOOKED: "Booked",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    INVOICED: "Invoiced",
    PAID: "Paid",
  };
  const loadsByStatus = statusOrder.map((s) => ({
    status: statusLabels[s],
    count: loads.filter((l) => l.status === s).length,
  }));

  const totalMiles = loads.reduce((s, l) => s + Number(l.miles), 0);
  const activeLoads = loads.filter((l) => l.status === "BOOKED" || l.status === "IN_TRANSIT").length;

  return {
    totalLoads: loads.length,
    activeLoads,
    totalMiles,
    loadsByStatus,
  };
}

export async function getDetailedAnalytics(companyId: string, fleetId: string | undefined, days: number) {
  const fleetScope = { companyId, ...(fleetId ? { id: fleetId } : {}) };
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);
  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - days);

  const [trucks, payments, loadsInWindow] = await Promise.all([
    prisma.truck.findMany({ where: { fleet: fleetScope }, select: { status: true } }),
    prisma.payment.findMany({
      where: { load: { fleet: fleetScope }, date: { gte: prevPeriodStart } },
      select: { grossAmount: true, status: true, date: true },
    }),
    prisma.load.findMany({
      where: { fleet: fleetScope, pickupDate: { gte: prevPeriodStart } },
      select: { pickupDate: true },
    }),
  ]);

  const loadsInPeriod = loadsInWindow.filter((l) => l.pickupDate >= periodStart).length;
  const loadsInPrevPeriod = loadsInWindow.filter(
    (l) => l.pickupDate >= prevPeriodStart && l.pickupDate < periodStart
  ).length;

  const truckStatus = [
    { status: "Active", count: trucks.filter((t) => t.status === "ACTIVE").length },
    { status: "Idle", count: trucks.filter((t) => t.status === "IDLE").length },
    { status: "Inactive", count: trucks.filter((t) => t.status === "INACTIVE").length },
  ];

  const currentPayments = payments.filter((p) => p.date >= periodStart);
  const prevPayments = payments.filter((p) => p.date >= prevPeriodStart && p.date < periodStart);

  const paymentStatus = [
    { status: "Pending", count: currentPayments.filter((p) => p.status === "PENDING").length },
    { status: "Received", count: currentPayments.filter((p) => p.status === "RECEIVED").length },
  ];

  const currentReceived = currentPayments
    .filter((p) => p.status === "RECEIVED")
    .reduce((s, p) => s + Number(p.grossAmount), 0);
  const prevReceived = prevPayments
    .filter((p) => p.status === "RECEIVED")
    .reduce((s, p) => s + Number(p.grossAmount), 0);
  const paymentTrendChange = prevReceived > 0 ? ((currentReceived - prevReceived) / prevReceived) * 100 : 0;

  const loadsTrendChange =
    loadsInPrevPeriod > 0 ? ((loadsInPeriod - loadsInPrevPeriod) / loadsInPrevPeriod) * 100 : 0;

  // Weekly buckets of received-payment totals within the period, for the mini trend chart.
  const buckets = 4;
  const bucketSize = Math.max(1, Math.floor(days / buckets));
  const monthlyPaymentTrend = Array.from({ length: buckets }, (_, i) => {
    const bStart = new Date(periodStart);
    bStart.setDate(bStart.getDate() + i * bucketSize);
    const bEnd = new Date(bStart);
    bEnd.setDate(bEnd.getDate() + bucketSize);
    const amount = currentPayments
      .filter((p) => p.status === "RECEIVED" && p.date >= bStart && p.date < bEnd)
      .reduce((s, p) => s + Number(p.grossAmount), 0);
    return { label: `${bStart.getMonth() + 1}/${bStart.getDate()}`, amount };
  });

  const loadsTrend = Array.from({ length: buckets }, (_, i) => {
    const bStart = new Date(periodStart);
    bStart.setDate(bStart.getDate() + i * bucketSize);
    const bEnd = new Date(bStart);
    bEnd.setDate(bEnd.getDate() + bucketSize);
    const count = loadsInWindow.filter(
      (l) => l.pickupDate >= bStart && l.pickupDate < bEnd
    ).length;
    return { label: `${bStart.getMonth() + 1}/${bStart.getDate()}`, loads: count };
  });

  return {
    truckStatus,
    paymentStatus,
    monthlyPaymentTrend,
    paymentTrendChange,
    loadsTrend,
    loadsTrendChange,
    loadsInPeriod,
  };
}
