"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatus } from "@/lib/actions/payment-actions";

export function PaymentStatusToggle({
  paymentId,
  status,
}: {
  paymentId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "RECEIVED") return null;

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updatePaymentStatus(paymentId, "RECEIVED");
          router.refresh();
        })
      }
      className="text-xs font-medium text-brand underline-offset-2 hover:underline disabled:opacity-60"
    >
      Mark received
    </button>
  );
}
