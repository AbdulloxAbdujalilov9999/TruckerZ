"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Fleet } from "@/generated/prisma/client";

export function PaymentsToolbar({ fleets }: { fleets: Fleet[] }) {
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
      <select
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => setParam("status", e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="all">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="RECEIVED">Received</option>
      </select>
    </div>
  );
}
