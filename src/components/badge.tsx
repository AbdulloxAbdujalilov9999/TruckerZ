const LOAD_STATUS_STYLES: Record<string, string> = {
  BOOKED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  IN_TRANSIT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DELIVERED: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  INVOICED: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  PAID: "bg-success/10 text-success",
};

const TRUCK_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  IDLE: "bg-warning/10 text-warning",
  INACTIVE: "bg-danger/10 text-danger",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  RECEIVED: "bg-success/10 text-success",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function LoadStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge label={label} className={LOAD_STATUS_STYLES[status] ?? ""} />;
}

export function TruckStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge label={label} className={TRUCK_STATUS_STYLES[status] ?? ""} />;
}

export function PaymentStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge label={label} className={PAYMENT_STATUS_STYLES[status] ?? ""} />;
}
