"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { Fleet } from "@/generated/prisma/client";

export function TrucksToolbar({ fleets }: { fleets: Fleet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get("fleet") ?? "all"}
        onChange={(e) => setParam("fleet", e.target.value)}
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
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search by truck number, driver name, or type..."
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <select
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => setParam("status", e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="all">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="IDLE">Idle</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  );
}
