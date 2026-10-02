import { Receipt, Hash, BarChart3, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, EXPENSE_CATEGORY_LABELS } from "@/lib/format";
import { CreateExpenseButton } from "./create-expense-button";

export default async function ExpensesPage() {
  const user = await requireUser();

  const trucks = await prisma.truck.findMany({
    where: { fleet: { companyId: user.companyId } },
    select: { id: true, unitNumber: true },
    orderBy: { unitNumber: "asc" },
  });

  const expenses = await prisma.expense.findMany({
    where: { companyId: user.companyId },
    include: { truck: { select: { unitNumber: true } } },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  const avg = expenses.length ? total / expenses.length : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted">Track expenses across your fleet</p>
        </div>
        <CreateExpenseButton trucks={trucks} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Expenses" value={formatCurrency(total)} hint="Sum of all expenses" icon={Receipt} highlight />
        <StatCard label="Expense Count" value={String(expenses.length)} hint="Number of records" icon={Hash} />
        <StatCard
          label="Top Category"
          value={topCategory ? EXPENSE_CATEGORY_LABELS[topCategory[0]] : "None"}
          hint={topCategory ? formatCurrency(topCategory[1]) : "No expenses yet"}
          icon={BarChart3}
        />
        <StatCard label="Avg per Expense" value={formatCurrency(avg)} hint="Average expense amount" icon={TrendingUp} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses found" description="No expenses found for your fleet." />
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Truck</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted">{formatDate(e.date)}</td>
                  <td className="px-5 py-3">{EXPENSE_CATEGORY_LABELS[e.category]}</td>
                  <td className="px-5 py-3 text-muted">{e.truck?.unitNumber ?? "Company-wide"}</td>
                  <td className="px-5 py-3 text-muted">{e.description ?? "—"}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
