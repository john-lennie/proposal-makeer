import type { ReactNode } from "react";
import type { ProposalContentSnapshot, ProposalSectionContent } from "@/db/types";
import { brandStyle, isSafeLogoUrl } from "@/lib/brand";
import { formatCurrency } from "@/lib/proposal";

export type RenderProposalField = (section: ProposalSectionContent, path: string, value: string) => ReactNode;

export function StructuredProposalDocument({ snapshot, renderField, responseForm, revisionLabel }: {
  snapshot: ProposalContentSnapshot;
  renderField?: RenderProposalField;
  responseForm?: ReactNode;
  revisionLabel: string;
}) {
  const field = (section: ProposalSectionContent, path: string, value?: string) =>
    renderField ? renderField(section, path, value ?? "") : value;
  const logo = snapshot.provider.logoAssetUrl;
  return (
    <article className="brand-proposal bg-[#f5f1e8] text-ink" style={brandStyle(snapshot.theme)}>
      {snapshot.sections.map((section) => {
        const id = section.type === "text" ? "overview" : section.type;
        const dark = section.type === "text" || section.type === "acceptance";
        return (
          <section key={section.id} id={id} className={`proposal-section scroll-mt-24 ${dark ? "bg-[#262a22] text-[#f4f0e7]" : section.type === "cover" ? "brand-cover relative overflow-hidden" : section.type === "scope" || section.type === "terms" ? "brand-tint" : ""}`}>
            {section.type === "cover" && <div className="relative mb-20 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest">
              {logo && isSafeLogoUrl(logo) ? (
                // Native images support a studio's own image host without an allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={`${snapshot.provider.displayName} logo`} className="h-12 max-w-48 object-contain" />
              ) : <span className="grid size-10 place-items-center rounded-full border border-current">{snapshot.provider.displayName.charAt(0)}</span>}
              {snapshot.provider.displayName}
            </div>}
            <div className="relative mx-auto max-w-6xl">
              <p className={`eyebrow ${dark ? "text-white/65" : "text-ink/65"}`}>{field(section, "eyebrow", section.eyebrow)}</p>
              {section.type === "cover" ? <h1 className="brand-heading mt-6 max-w-5xl text-[clamp(3rem,8vw,8rem)] leading-[.94] tracking-[-0.055em]">{field(section, "title", section.title)}</h1> :
                <h2 className="brand-heading mt-6 max-w-4xl text-4xl leading-[1.05] tracking-[-0.04em] sm:text-6xl">{field(section, "title", section.title)}</h2>}
              {"introduction" in section || ["objectives", "scope", "deliverables", "timeline", "pricing"].includes(section.type) ?
                <p className="mt-7 max-w-2xl whitespace-pre-wrap text-lg leading-8 opacity-75">{field(section, "introduction", "introduction" in section ? section.introduction : "")}</p> : null}
              <div className="mt-10 sm:mt-14">
                {section.type === "cover" && <>
                  <p className="max-w-2xl whitespace-pre-wrap text-lg leading-8 text-ink/70">{field(section, "subtitle", section.subtitle)}</p>
                  <dl className="mt-16 grid gap-8 border-t border-ink/20 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                    {([ ["preparedFor", "Prepared for", section.preparedFor], ["preparedBy", "Prepared by", section.preparedBy], ["location", "Location", section.location], ["dateLabel", "Date", section.dateLabel] ] as const).map(([path, label, value]) => <div key={path}><dt className="mb-2 text-xs uppercase tracking-widest text-ink/55">{label}</dt><dd className="text-sm">{field(section, path, value)}</dd></div>)}
                  </dl>
                </>}
                {section.type === "text" && <div className="max-w-3xl space-y-6 text-lg leading-8 text-white/80">
                  {section.body.blocks.map((block, i) => block.type === "list" ?
                    <ul key={i} className="list-disc space-y-3 pl-6">{block.items?.map((item, j) => <li key={j}>{field(section, `body.blocks.${i}.items.${j}`, item)}</li>)}</ul> :
                    block.type === "heading" ? <h3 key={i} className="brand-heading text-3xl">{field(section, `body.blocks.${i}.text`, block.text)}</h3> :
                    <p key={i} className="whitespace-pre-wrap">{field(section, `body.blocks.${i}.text`, block.text)}</p>)}
                </div>}
                {(section.type === "objectives" || section.type === "terms") && <ol className="divide-y divide-ink/15 border-y border-ink/15">
                  {section.items.map((item, i) => <li key={item.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-5 py-6"><span className="pt-1 font-mono text-xs text-ink/50">{String(i + 1).padStart(2, "0")}</span><div className="whitespace-pre-wrap text-lg leading-8">{field(section, `items.${i}.text`, item.text)}</div></li>)}
                </ol>}
                {section.type === "scope" && <div className="grid gap-10 lg:grid-cols-3">{section.items.map((item, i) => <div key={item.id} className="min-w-0 border-t border-ink/20 pt-6">
                  <h3 className="brand-heading text-3xl">{field(section, `items.${i}.title`, item.title)}</h3>
                  <p className="mt-5 whitespace-pre-wrap leading-7 text-ink/75">{field(section, `items.${i}.description`, item.description)}</p>
                  <ul className="mt-6 space-y-3 border-t border-ink/15 pt-5 text-sm">{item.includes.map((text, j) => <li key={j} className="flex gap-3"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--brand-accent)]" /><span className="min-w-0">{field(section, `items.${i}.includes.${j}`, text)}</span></li>)}</ul>
                </div>)}</div>}
                {section.type === "deliverables" && <div className="grid gap-8 sm:grid-cols-2">{section.items.map((item, i) => <div key={item.id} className="min-w-0 border-t border-ink/20 pt-5">
                  <h3 className="text-xl font-medium">{field(section, `items.${i}.title`, item.title)}</h3>
                  <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/65">{field(section, `items.${i}.description`, item.description)}</p>
                </div>)}</div>}
                {section.type === "timeline" && <ol className="divide-y divide-ink/15 border-y border-ink/15">{section.phases.map((phase, i) => <li key={phase.id} className="grid gap-4 py-7 sm:grid-cols-[1fr_2fr]">
                  <p className="text-sm font-medium">{field(section, `phases.${i}.label`, phase.label)}</p><div className="min-w-0"><h3 className="brand-heading text-3xl">{field(section, `phases.${i}.title`, phase.title)}</h3><p className="mt-3 whitespace-pre-wrap leading-7 text-ink/65">{field(section, `phases.${i}.description`, phase.description)}</p></div>
                </li>)}</ol>}
                {section.type === "pricing" && <div className="max-w-4xl">
                  {section.items.map((item, i) => <div key={item.id} className="grid gap-4 border-b border-ink/20 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)]">
                    <div><h3 className="text-xl font-medium">{field(section, `items.${i}.label`, item.label)}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/65">{field(section, `items.${i}.description`, item.description)}</p></div>
                    <div className="font-mono text-sm sm:text-right">{renderField ? field(section, `items.${i}.amountMinor`, (item.amountMinor / 100).toFixed(2)) : formatCurrency(item.amountMinor / 100, snapshot.currency)}</div>
                  </div>)}
                  <div className="mt-8 flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">Total investment</p><p className="mt-2 text-xs text-ink/60">{snapshot.currency} · excluding applicable tax</p></div><p className="brand-heading text-5xl">{formatCurrency(section.items.reduce((total, item) => total + item.amountMinor, 0) / 100, snapshot.currency)}</p></div>
                  {section.taxLabel && <p className="mt-4 text-sm text-ink/65">{section.taxLabel}</p>}
                </div>}
                {section.type === "acceptance" && <>
                  <p className="max-w-2xl whitespace-pre-wrap text-lg leading-8 text-white/75">{field(section, "body", section.body)}</p>
                  {responseForm ?? <div className="mt-10 flex flex-wrap gap-4">
                    {renderField ? <><span className="button border border-white/30">{field(section, "acceptLabel", section.acceptLabel)}</span><span className="button border border-white/30">{field(section, "declineLabel", section.declineLabel)}</span></> : <><button type="button" disabled className="button border border-white/30 opacity-60">{section.acceptLabel}</button><button type="button" disabled className="button border border-white/30 opacity-60">{section.declineLabel}</button></>}
                  </div>}
                  <p className="mt-8 text-xs text-white/55">{revisionLabel}{snapshot.expiresAt ? ` · Valid until ${snapshot.expiresAt.slice(0, 10)}` : ""}</p>
                </>}
              </div>
            </div>
          </section>
        );
      })}
    </article>
  );
}
