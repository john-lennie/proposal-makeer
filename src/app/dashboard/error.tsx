"use client";

import { AppShell } from "@/components/app-shell";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell active="dashboard">
      <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-6 text-center">
        <div>
          <p className="eyebrow text-olive">Unable to load proposals</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-0.04em]">
            The studio hit a snag.
          </h1>
          <p className="mt-4 leading-7 text-ink/55">
            Your proposals are safe. Try loading the dashboard again.
          </p>
          <button type="button" onClick={reset} className="button button-dark mt-7">
            Try again
          </button>
        </div>
      </main>
    </AppShell>
  );
}
