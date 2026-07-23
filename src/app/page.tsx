import Link from "next/link";

import { ArrowUpRight, Check, Mark } from "@/components/icons";

const principles = [
  "Structured sections that keep every proposal coherent",
  "Private preview before anything reaches your client",
  "Published revisions that preserve exactly what was accepted",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold tracking-[-0.03em]"
          aria-label="Sonder proposals home"
        >
          <Mark />
          Sonder
        </Link>
        <nav className="flex items-center gap-3" aria-label="Primary navigation">
          <a
            href="#how-it-works"
            className="hidden px-3 py-2 text-sm text-ink/65 transition hover:text-ink sm:block"
          >
            How it works
          </a>
          <Link href="/dashboard" className="button button-dark">
            Open studio <ArrowUpRight />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-[1440px] items-center gap-16 px-6 py-16 sm:px-10 lg:grid-cols-[1.08fr_.92fr] lg:px-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow mb-7">Proposals, thoughtfully presented</p>
          <h1 className="font-display text-[clamp(3.75rem,8vw,8.6rem)] leading-[.82] tracking-[-0.065em]">
            Make the work
            <span className="block italic text-olive">feel inevitable.</span>
          </h1>
          <p className="mt-10 max-w-xl text-lg leading-8 text-ink/66 sm:text-xl">
            Create polished, interactive proposals that give your ideas room to
            breathe—and your clients a clear path to yes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link href="/dashboard" className="button button-dark">
              Create a proposal <ArrowUpRight />
            </Link>
            <Link
              href="/p/demo-proposal"
              className="text-link"
            >
              View an example
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[570px] lg:mr-0">
          <div className="absolute -inset-6 -z-0 rounded-[2rem] bg-[#d9ddcc]" />
          <div className="relative overflow-hidden rounded-[1.4rem] border border-ink/10 bg-cream shadow-[0_30px_80px_rgba(35,38,28,.14)]">
            <div className="flex items-center justify-between border-b border-ink/10 px-7 py-5 text-[11px] uppercase tracking-[.2em] text-ink/45">
              <span>Prepared for Alder House</span>
              <span>01 / 09</span>
            </div>
            <div className="px-8 py-14 sm:px-12 sm:py-20">
              <div className="mb-16 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em]">
                <span className="grid size-7 place-items-center rounded-full border border-ink/30">
                  N
                </span>
                North &amp; Finch
              </div>
              <p className="eyebrow">Private relocation proposal</p>
              <h2 className="mt-5 max-w-sm font-display text-5xl leading-[.94] tracking-[-0.045em] sm:text-6xl">
                A considered move, from first box to final detail.
              </h2>
              <div className="mt-14 flex items-end justify-between border-t border-ink/15 pt-5 text-sm">
                <span className="text-ink/55">Toronto → Montréal</span>
                <span>September 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-t border-ink/10 bg-ink px-6 py-24 text-paper sm:px-10 lg:px-16 lg:py-32"
      >
        <div className="mx-auto grid max-w-[1312px] gap-16 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-paper/50">A calmer way to propose</p>
            <h2 className="mt-5 max-w-md font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
              Structure where it matters. Freedom where it counts.
            </h2>
          </div>
          <ol className="divide-y divide-paper/15 border-y border-paper/15">
            {principles.map((principle, index) => (
              <li
                key={principle}
                className="flex gap-5 py-7 text-lg leading-7 text-paper/78"
              >
                <span className="mt-1 font-mono text-xs text-sage">
                  0{index + 1}
                </span>
                <span className="flex-1">{principle}</span>
                <Check className="mt-1 text-sage" />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
