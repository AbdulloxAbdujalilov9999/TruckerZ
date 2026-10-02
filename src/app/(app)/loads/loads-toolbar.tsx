"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { Fleet } from "@/generated/prisma/client";

const QUICK_RANGES: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Q1", value: "q1" },
  { label: "Q2", value: "q2" },
  { label: "Q3", value: "q3" },
  { label: "Q4", value: "q4" },
];

export function LoadsToolbar({ fleets }: { fleets: Fleet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeRange = searchParams.get("range");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setParam({ range: r.value, from: null, to: null })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              activeRange === r.value
                ? "border-brand bg-brand-soft text-brand"
                : "border-border bg-surface text-foreground/80"
            }`}
          >
            {r.label}
          </button>
        ))}
        <input
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => setParam({ from: e.target.value, range: null })}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => setParam({ to: e.target.value, range: null })}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          defaultValue={searchParams.get("fleet") ?? "all"}
          onChange={(e) => setParam({ fleet: e.target.value })}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All Fleets</option>
          {fleets.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => setParam({ q: e.target.value })}
            placeholder="Search by load#, broker, origin, destination, or truck..."
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <select
          defaultValue={searchParams.get("status") ?? "all"}
          onChange={(e) => setParam({ status: e.target.value })}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="BOOKED">Booked</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="INVOICED">Invoiced</option>
          <option value="PAID">Paid</option>
        </select>
      </div>
    </div>
  );
}
