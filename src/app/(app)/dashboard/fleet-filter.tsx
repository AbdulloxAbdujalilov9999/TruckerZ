"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Fleet } from "@/generated/prisma/client";

export function DashboardFleetFilter({ fleets }: { fleets: Fleet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get("fleet") ?? "all"}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value === "all") params.delete("fleet");
        else params.set("fleet", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
    >
      <option value="all">All Fleets</option>
      {fleets.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
