import Link from "next/link";

export default function BrandNotFound() {
  return <main className="mx-auto max-w-xl px-6 py-20"><h1 className="font-display text-4xl">Workspace not found.</h1><Link href="/dashboard" className="text-link mt-6">Back to proposals</Link></main>;
}
