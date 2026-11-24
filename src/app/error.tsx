"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted max-w-sm">
        We hit a snag loading this page. This is usually temporary — try again in a moment.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-brand text-brand-foreground px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
