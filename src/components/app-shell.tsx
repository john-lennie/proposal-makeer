import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/auth/actions";
import { Mark } from "@/components/icons";

interface AppShellProps {
  children: ReactNode;
  active?: "dashboard" | "brand";
  profile?: {
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, active, profile }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f2ee] text-ink">
      <header className="border-b border-ink/10 bg-[#f8f7f3]">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center gap-4 sm:gap-10">
            <Link
              href="/"
              aria-label="Sonder home"
              className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]"
            >
              <Mark className="size-6" />
              Sonder
            </Link>
            <nav aria-label="Application navigation" className="flex gap-4 sm:gap-6">
              <Link
                href="/dashboard"
                aria-current={active === "dashboard" ? "page" : undefined}
                className={`text-sm ${
                  active === "dashboard" ? "text-ink" : "text-ink/55"
                }`}
              >
                Proposals
              </Link>
              <Link href="/settings/brand" aria-current={active === "brand" ? "page" : undefined} className={`text-sm ${active === "brand" ? "text-ink" : "text-ink/55"}`}>Brand</Link>
            </nav>
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{profile.name}</p>
                <p className="text-xs text-ink/45">{profile.email}</p>
              </div>
              {profile.avatarUrl ? (
                // Better Auth validates and stores the URL; the native image
                // avoids coupling account avatars to an image-host allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <span
                  className="grid size-9 place-items-center rounded-full bg-[#d9b891] text-xs font-semibold"
                  aria-hidden="true"
                >
                  {initials(profile.name)}
                </span>
              )}
              <form action={signOutAction}>
                <button type="submit" className="text-link text-xs">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
