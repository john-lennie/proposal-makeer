import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BrandSettingsForm } from "@/components/brand-settings-form";
import { getWorkspaceBrand } from "@/data/brand";
import { getWorkspaceMemberProfile, requireWorkspaceMember } from "@/lib/authorization";

export const metadata = { title: "Brand settings — Sonder", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const context = await requireWorkspaceMember();
  const [brand, profile] = await Promise.all([getWorkspaceBrand(context.workspaceId), getWorkspaceMemberProfile(context)]);
  if (!brand) notFound();
  return <AppShell active="brand" profile={profile}>
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <p className="eyebrow text-olive">Studio identity</p>
      <h1 className="mt-3 font-display text-5xl tracking-[-0.04em]">Make it yours.</h1>
      <p className="mb-10 mt-4 max-w-xl text-sm leading-7 text-ink/65">Set your studio’s brand once. Every draft becomes a proposal that feels like you.</p>
      <BrandSettingsForm brand={brand} canEdit={context.role === "OWNER" || context.role === "ADMIN"} />
    </main>
  </AppShell>;
}
