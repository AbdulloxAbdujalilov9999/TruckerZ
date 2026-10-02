import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div className="text-base font-medium">{title}</div>
      <div className="mt-1 max-w-sm text-sm text-muted">{description}</div>
    </div>
  );
}
