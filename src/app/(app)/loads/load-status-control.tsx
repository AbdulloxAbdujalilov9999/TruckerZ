"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { updateLoadStatus } from "@/lib/actions/load-actions";
import { nextManualStatuses, type LoadStatusValue } from "@/lib/business";
import { LOAD_STATUS_LABELS } from "@/lib/format";

export function LoadStatusControl({
  loadId,
  currentStatus,
}: {
  loadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const options = nextManualStatuses(currentStatus as LoadStatusValue);
  if (options.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LoadStatusValue;
    if (!next) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateLoadStatus(loadId, next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update status.");
      }
      e.target.value = "";
    });
  }

  return (
    <div className="flex items-center gap-1">
      <ChevronRight className="h-3 w-3 text-muted" />
      <select
        onChange={handleChange}
        disabled={isPending}
        defaultValue=""
        className="rounded-md border border-border bg-background px-1.5 py-1 text-xs text-muted"
      >
        <option value="" disabled>
          Move to…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {LOAD_STATUS_LABELS[o]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
