"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
];

export function DetailRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get("detailRange") ?? "30"}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("detailRange", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
