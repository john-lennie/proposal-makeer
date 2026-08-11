import { AppShell } from "@/components/app-shell";

export default function DashboardLoading() {
  return (
    <AppShell active="dashboard">
      <main
        className="mx-auto w-full max-w-[1440px] animate-pulse px-5 py-10 sm:px-8 lg:px-12 lg:py-16"
        aria-busy="true"
        aria-label="Loading proposals"
      >
        <div className="h-3 w-20 rounded bg-ink/10" />
        <div className="mt-5 h-14 w-64 rounded bg-ink/10" />
        <div className="mt-14 h-72 rounded-xl bg-ink/8" />
      </main>
    </AppShell>
  );
}
