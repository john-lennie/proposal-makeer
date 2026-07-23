import Link from "next/link";
import type { ReactNode } from "react";

import { Mark } from "@/components/icons";

interface AppShellProps {
  children: ReactNode;
  active?: "dashboard";
}

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f2ee] text-ink">
      <header className="border-b border-ink/10 bg-[#f8f7f3]">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              aria-label="Sonder home"
              className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]"
            >
              <Mark className="size-6" />
              Sonder
            </Link>
            <nav aria-label="Application navigation" className="hidden sm:block">
              <Link
                href="/dashboard"
                aria-current={active === "dashboard" ? "page" : undefined}
                className={`text-sm ${
                  active === "dashboard" ? "text-ink" : "text-ink/55"
                }`}
              >
                Proposals
              </Link>
            </nav>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-[#d9b891] text-xs font-semibold"
            aria-label="Open account menu"
          >
            JL
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
