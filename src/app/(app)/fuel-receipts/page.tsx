import { Fuel, DollarSign, Hash, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { SubmitFuelReceiptButton } from "./submit-fuel-receipt-button";

export default async function FuelReceiptsPage() {
  const user = await requireUser();
  const isDriver = user.role === "DRIVER";

  const trucks = await prisma.truck.findMany({
    where: {
      fleet: { companyId: user.companyId },
      ...(isDriver ? { OR: [{ driverId: user.id }, { secondaryDriverId: user.id }] } : {}),
    },
    select: { id: true, unitNumber: true },
    orderBy: { unitNumber: "asc" },
  });

  const receipts = await prisma.expense.findMany({
    where: {
      companyId: user.companyId,
      category: "FUEL",
      ...(isDriver ? { submittedById: user.id } : {}),
    },
    include: { truck: { select: { unitNumber: true } } },
    orderBy: { date: "desc" },
  });

  const totalGallons = receipts.reduce((s, r) => s + Number(r.gallons ?? 0), 0);
  const totalSpent = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const avgPerGallon = totalGallons > 0 ? totalSpent / totalGallons : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fuel Receipts</h1>
          <p className="mt-1 text-sm text-muted">
            {isDriver ? "Submit a receipt and see what you've logged." : "Fuel purchases by date, state, and gallons."}
          </p>
        </div>
        <SubmitFuelReceiptButton trucks={trucks} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receipts" value={String(receipts.length)} icon={Hash} />
        <StatCard label="Total Gallons" value={totalGallons.toFixed(1)} icon={Fuel} />
        <StatCard label="Total Spent" value={formatCurrency(totalSpent)} icon={DollarSign} />
        <StatCard label="Avg per Gallon" value={formatCurrency(avgPerGallon)} icon={Gauge} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        {receipts.length === 0 ? (
          <EmptyState
            icon={Fuel}
            title="No fuel receipts yet"
            description="Submit one to start tracking fuel by date, state, and gallons."
          />
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Truck</th>
                <th className="px-5 py-3 font-medium">State</th>
                <th className="px-5 py-3 font-medium">Gallons</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">$/Gal</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 font-medium">{r.truck?.unitNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{r.state}</td>
                  <td className="px-5 py-3 text-muted">{Number(r.gallons).toFixed(1)}</td>
                  <td className="px-5 py-3">{formatCurrency(r.amount)}</td>
                  <td className="px-5 py-3 text-muted">
                    {formatCurrency(Number(r.gallons) > 0 ? Number(r.amount) / Number(r.gallons) : 0)}
                  </td>
                  <td className="px-5 py-3">
                    {r.receiptFilePath && (
                      <a
                        href={`/api/receipts/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand"
                      >
                        View
                      </a>
                    )}
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
