"use client";

export default function PreviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-xl px-6 py-20"><h1 className="font-display text-4xl">We couldn’t load the preview.</h1><p className="my-6 text-sm">Your saved draft is safe. Try loading it again.</p><button type="button" onClick={reset} className="button button-dark">Try again</button></main>;
}
