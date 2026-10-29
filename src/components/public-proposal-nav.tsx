import { Mark } from "@/components/icons";
import type { DemoProposal } from "@/lib/proposal";
import type { ThemeSettings } from "@/db/types";
import { brandStyle, isSafeLogoUrl } from "@/lib/brand";

const links = [
  { href: "#overview", label: "Overview" },
  { href: "#scope", label: "Scope" },
  { href: "#timeline", label: "Timeline" },
  { href: "#pricing", label: "Investment" },
];

export function PublicProposalNav({ proposal, theme = {} }: { proposal: DemoProposal; theme?: ThemeSettings }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5" style={brandStyle(theme)}>
      <div className="mx-auto flex max-w-[1360px] items-center justify-between rounded-full border border-white/15 bg-[#20231d]/92 px-4 py-2.5 text-[#f4f0e7] shadow-lg shadow-black/10 backdrop-blur-md sm:px-5">
        <a
          href="#cover"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em]"
          aria-label={`${proposal.company} proposal top`}
        >
          {theme.logoAssetUrl && isSafeLogoUrl(theme.logoAssetUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={theme.logoAssetUrl} alt="" className="h-7 max-w-24 object-contain" />
          ) : <Mark className="size-5" />}
          <span className="hidden xs:inline">{proposal.company}</span>
        </a>
        <nav aria-label="Proposal navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.filter((link) => proposal.sections.some((section) => `#${section.id}` === link.href)).map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-3 py-2 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#acceptance"
          className="rounded-full bg-[var(--brand-accent)] px-4 py-2 text-xs font-semibold text-[var(--brand-on-accent)] transition hover:opacity-90"
        >
          Review &amp; accept
        </a>
      </div>
    </header>
  );
}
