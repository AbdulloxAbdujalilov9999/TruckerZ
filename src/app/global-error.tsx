"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted max-w-sm">
            TruckerZ hit an unexpected error. Please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-brand text-brand-foreground px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
