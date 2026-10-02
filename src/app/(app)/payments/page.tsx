import { DollarSign, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusBadge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { CreatePaymentButton } from "./create-payment-button";
import { PaymentStatusToggle } from "./payment-status-toggle";
import { PaymentsToolbar } from "./payments-toolbar";

export default async function PaymentsPage({
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

  const fleetFilter = params.fleet && params.fleet !== "all" ? params.fleet : undefined;
  const statusFilter = params.status && params.status !== "all" ? params.status : undefined;

  const payments = await prisma.payment.findMany({
    where: {
      load: {
        fleet: { companyId: user.companyId, ...(fleetFilter ? { id: fleetFilter } : {}) },
      },
      ...(statusFilter ? { status: statusFilter as "PENDING" | "RECEIVED" } : {}),
    },
    include: { load: { include: { truck: true } } },
    orderBy: { date: "desc" },
  });

  const eligibleLoads = await prisma.load.findMany({
    where: {
      fleet: { companyId: user.companyId },
      payment: null,
      status: { in: ["DELIVERED", "INVOICED", "PAID"] },
    },
    include: { truck: true },
    orderBy: { pickupDate: "desc" },
  });

  const allPayments = await prisma.payment.findMany({
    where: { load: { fleet: { companyId: user.companyId } } },
    include: { load: { select: { createdById: true } } },
  });

  const totalGross = allPayments.reduce((sum, p) => sum + Number(p.grossAmount), 0);
  const pending = allPayments.filter((p) => p.status === "PENDING");
  const received = allPayments.filter((p) => p.status === "RECEIVED");
  const myEarnings = allPayments
    .filter((p) => p.load.createdById === user.id)
    .reduce((sum, p) => sum + Number(p.dispatcherEarning), 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-muted">Track payments for your dispatched loads</p>
        </div>
        <CreatePaymentButton loads={eligibleLoads} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Payments"
          value={String(allPayments.length)}
          hint="All loads"
          icon={DollarSign}
        />
        <StatCard label="Total Gross" value={formatCurrency(totalGross)} hint="Load revenue" icon={DollarSign} />
        <StatCard
          label="Pending"
          value={String(pending.length)}
          hint="Awaiting receipt"
          icon={Clock}
          highlight
        />
        <StatCard
          label="Received"
          value={String(received.length)}
          hint="Payments completed"
          icon={CheckCircle2}
        />
        <StatCard
          label="My Earnings"
          value={formatCurrency(myEarnings)}
          hint="Your dispatch cut"
          icon={Wallet}
        />
      </div>

      <div className="mt-6">
        <PaymentsToolbar fleets={fleets} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        {payments.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No payments found"
            description="No payments have been created for your loads yet."
          />
        ) : (
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Load</th>
                <th className="px-5 py-3 font-medium">Truck</th>
                <th className="px-5 py-3 font-medium">Gross</th>
                <th className="px-5 py-3 font-medium">Driver Fee</th>
                <th className="px-5 py-3 font-medium">Dispatcher Cut</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{p.load.loadNumber ?? p.load.broker}</td>
                  <td className="px-5 py-3 text-muted">{p.load.truck.unitNumber}</td>
                  <td className="px-5 py-3">{formatCurrency(p.grossAmount)}</td>
                  <td className="px-5 py-3 text-muted">{formatCurrency(p.driverFeeAmount)}</td>
                  <td className="px-5 py-3 text-muted">{formatCurrency(p.dispatcherEarning)}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(p.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <PaymentStatusBadge status={p.status} label={p.status === "PENDING" ? "Pending" : "Received"} />
                      <PaymentStatusToggle paymentId={p.id} status={p.status} />
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
