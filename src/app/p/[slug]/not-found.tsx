import Link from "next/link";

import { ArrowLeft, Mark } from "@/components/icons";

export default function ProposalNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f1ede3] px-6 text-ink">
      <div className="max-w-lg text-center">
        <Mark className="mx-auto size-8 text-olive" />
        <p className="eyebrow mt-8 text-olive">Proposal unavailable</p>
        <h1 className="mt-5 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
          This proposal can’t be viewed.
        </h1>
        <p className="mt-6 leading-7 text-ink/60">
          It may have expired, been withdrawn, or the address may be incorrect.
          Please contact the proposal sender for help.
        </p>
        <Link href="/" className="button button-dark mt-9">
          <ArrowLeft />
          Return home
        </Link>
      </div>
    </main>
  );
}
