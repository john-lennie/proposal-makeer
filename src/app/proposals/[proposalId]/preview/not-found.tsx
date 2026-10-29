import Link from "next/link";

export default function PreviewNotFound() {
  return <main className="mx-auto max-w-xl px-6 py-20"><h1 className="font-display text-4xl">Proposal not found.</h1><p className="my-6 text-sm">This draft may have been removed or belongs to another workspace.</p><Link href="/dashboard" className="text-link">Back to proposals</Link></main>;
}
