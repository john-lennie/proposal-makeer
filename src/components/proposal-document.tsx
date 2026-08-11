import type {
  DemoProposal,
  ProposalSection,
  ProposalSectionId,
} from "@/lib/proposal";
import { formatCurrency } from "@/lib/proposal";

interface ProposalDocumentProps {
  proposal: DemoProposal;
  mode?: "public" | "preview";
  responseForm?: React.ReactNode;
}

export function ProposalDocument({
  proposal,
  mode = "public",
  responseForm,
}: ProposalDocumentProps) {
  const section = (id: ProposalSectionId): ProposalSection =>
    proposal.sections.find((item) => item.id === id) ?? {
      id,
      label: "",
      eyebrow: "",
      title: "",
      body: "",
    };
  const total = proposal.pricing.reduce((sum, item) => sum + item.amount, 0);

  const sectionElements = [
      <section
        key="cover"
        id="cover"
        className="proposal-cover relative flex min-h-[92vh] scroll-mt-20 flex-col justify-between overflow-hidden px-6 pb-10 pt-28 sm:px-10 lg:px-[8vw] lg:pb-14"
      >
        <div className="absolute right-[-15%] top-[4%] size-[70vw] max-h-[720px] max-w-[720px] rounded-full bg-[#d5dac5] opacity-70 blur-[1px]" />
        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em]">
          <span className="grid size-8 place-items-center rounded-full border border-current">
            N
          </span>
          {proposal.company}
        </div>
        <div className="relative z-10 max-w-5xl py-24">
          <p className="eyebrow">{section("cover").eyebrow}</p>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(4rem,9vw,9rem)] leading-[.84] tracking-[-0.06em]">
            {section("cover").title}
          </h1>
        </div>
        <div className="relative z-10 grid gap-5 border-t border-current/20 pt-5 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-xs uppercase tracking-[.16em] opacity-50">
              Prepared for
            </span>
            <span className="mt-1 block">{proposal.client}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[.16em] opacity-50">
              Relocation
            </span>
            <span className="mt-1 block">{proposal.clientLocation}</span>
          </div>
          <div className="sm:text-right">
            <span className="block text-xs uppercase tracking-[.16em] opacity-50">
              {mode === "preview" ? "Draft preview" : `Revision ${proposal.revision}`}
            </span>
            <span className="mt-1 block">{proposal.dateLabel}</span>
          </div>
        </div>
      </section>,

      <section
        key="overview"
        id="overview"
        className="proposal-section scroll-mt-20 bg-[#262a22] text-[#f4f0e7]"
      >
        <p className="eyebrow text-[#bdc5a8]">{section("overview").eyebrow}</p>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
          <h2 className="font-display text-5xl leading-[.95] tracking-[-0.045em] sm:text-7xl">
            {section("overview").title}
          </h2>
          <p className="max-w-xl text-lg leading-8 text-white/68 lg:pt-2">
            {section("overview").body}
          </p>
        </div>
      </section>,

      <section
        key="objectives"
        id="objectives"
        className="proposal-section scroll-mt-20"
      >
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="eyebrow">{section("objectives").eyebrow}</p>
            <h2 className="mt-6 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
              {section("objectives").title}
            </h2>
          </div>
          <ol className="border-t border-ink/20">
            {proposal.objectives.map((objective, index) => (
              <li
                key={objective}
                className="grid grid-cols-[2rem_1fr] gap-4 border-b border-ink/20 py-6 text-lg leading-7"
              >
                <span className="font-mono text-xs text-ink/45">0{index + 1}</span>
                {objective}
              </li>
            ))}
          </ol>
        </div>
      </section>,

      <section
        key="scope"
        id="scope"
        className="proposal-section scroll-mt-20 border-y border-ink/10 bg-[#e2dfd2]"
      >
        <p className="eyebrow">{section("scope").eyebrow}</p>
        <h2 className="mt-6 max-w-2xl font-display text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
          {section("scope").title}
        </h2>
        <div className="mt-16 grid border-t border-ink/20 lg:grid-cols-3">
          {proposal.scope.map((item) => (
            <div
              key={item.number}
              className="border-b border-ink/20 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="font-mono text-xs text-ink/45">{item.number}</span>
              <h3 className="mt-8 font-display text-4xl">{item.title}</h3>
              <p className="mt-4 min-h-24 leading-7 text-ink/65">
                {item.description}
              </p>
              <ul className="mt-8 space-y-3 border-t border-ink/15 pt-5 text-sm">
                {item.includes.map((included) => (
                  <li key={included} className="flex items-center gap-3">
                    <span className="size-1 rounded-full bg-olive" />
                    {included}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>,

      <section
        key="deliverables"
        id="deliverables"
        className="proposal-section scroll-mt-20"
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="eyebrow">{section("deliverables").eyebrow}</p>
            <h2 className="mt-6 max-w-xl font-display text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
              {section("deliverables").title}
            </h2>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {proposal.deliverables.map((item, index) => (
              <li
                key={item}
                className="flex gap-4 border-b border-ink/15 py-5 leading-6"
              >
                <span className="font-mono text-[10px] text-ink/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>,

      <section
        key="timeline"
        id="timeline"
        className="proposal-section scroll-mt-20 bg-[#c8cfb5]"
      >
        <p className="eyebrow">{section("timeline").eyebrow}</p>
        <h2 className="mt-6 max-w-2xl font-display text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
          {section("timeline").title}
        </h2>
        <div className="relative mt-16 grid gap-0 border-t border-ink/25 lg:grid-cols-4">
          {proposal.timeline.map((phase, index) => (
            <div
              key={phase.title}
              className="relative border-b border-ink/25 py-8 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="absolute -top-1.5 left-0 size-3 rounded-full border-2 border-[#c8cfb5] bg-ink lg:left-7 lg:first:left-0" />
              <span className="font-mono text-xs uppercase tracking-[.12em] text-ink/55">
                {phase.date}
              </span>
              <h3 className="mt-8 text-lg font-semibold">{phase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                {phase.description}
              </p>
              <span className="mt-8 block font-display text-4xl italic text-ink/20">
                0{index + 1}
              </span>
            </div>
          ))}
        </div>
      </section>,

      <section
        key="pricing"
        id="pricing"
        className="proposal-section scroll-mt-20"
      >
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="eyebrow">{section("pricing").eyebrow}</p>
            <h2 className="mt-6 font-display text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
              {section("pricing").title}
            </h2>
            <p className="mt-6 max-w-sm leading-7 text-ink/60">
              {section("pricing").body}
            </p>
          </div>
          <div>
            <div className="border-t border-ink/25">
              {proposal.pricing.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[1fr_auto] gap-6 border-b border-ink/15 py-5"
                >
                  <div>
                    <h3 className="font-medium">{item.label}</h3>
                    <p className="mt-1 text-sm text-ink/50">{item.detail}</p>
                  </div>
                  <span className="font-mono text-sm">
                    {formatCurrency(item.amount, proposal.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-end justify-between pt-8">
              <div>
                <span className="eyebrow">Total investment</span>
                <span className="mt-2 block text-sm text-ink/50">
                  CAD · excluding applicable tax
                </span>
              </div>
              <span className="font-display text-5xl tracking-[-0.04em] sm:text-6xl">
                {formatCurrency(total, proposal.currency)}
              </span>
            </div>
          </div>
        </div>
      </section>,

      <section
        key="terms"
        id="terms"
        className="proposal-section scroll-mt-20 border-y border-ink/10 bg-[#ded7c7]"
      >
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="eyebrow">{section("terms").eyebrow}</p>
            <h2 className="mt-6 font-display text-5xl leading-none tracking-[-0.04em]">
              {section("terms").title}
            </h2>
          </div>
          <ol className="space-y-5">
            {proposal.terms.map((term, index) => (
              <li key={term} className="flex gap-5 text-sm leading-6">
                <span className="font-mono text-[10px] text-ink/45">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {term}
              </li>
            ))}
          </ol>
        </div>
      </section>,

      <section
        key="acceptance"
        id="acceptance"
        className="proposal-section scroll-mt-20 bg-[#262a22] text-[#f4f0e7]"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow text-[#bdc5a8]">
            {section("acceptance").eyebrow}
          </p>
          <h2 className="mt-7 font-display text-5xl leading-[.95] tracking-[-0.04em] sm:text-7xl">
            {section("acceptance").title}
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/65">
            {section("acceptance").body}
          </p>
          {mode === "public" && responseForm ? (
            responseForm
          ) : (
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" disabled className="button bg-[#d6dcbf] text-ink opacity-55">
                {proposal.acceptLabel}
              </button>
              <button type="button" disabled className="button border border-white/25 text-white opacity-55">
                {proposal.declineLabel}
              </button>
            </div>
          )}
          <p className="mt-6 text-xs leading-5 text-white/40">
            {mode === "preview"
              ? "This private preview reflects the current draft."
              : `Valid until ${proposal.validUntil}. Acceptance applies to revision ${proposal.revision}.`}
          </p>
        </div>
      </section>,
  ];
  const sectionsById = new Map(
    sectionElements.map((element) => [element.key, element]),
  );

  return (
    <article className="proposal-document bg-[#f1ede3] text-[#20231d]">
      {proposal.sections.map(({ id }) => sectionsById.get(id))}
    </article>
  );
}
