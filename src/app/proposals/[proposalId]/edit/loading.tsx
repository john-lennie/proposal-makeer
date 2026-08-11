export default function ProposalEditorLoading() {
  return (
    <main
      className="grid min-h-screen animate-pulse grid-cols-[280px_1fr] bg-[#f2f1ed]"
      aria-busy="true"
      aria-label="Loading proposal editor"
    >
      <div className="border-r border-ink/10 bg-[#e9e8e2]" />
      <div className="mx-auto w-full max-w-3xl px-12 py-24">
        <div className="h-10 w-56 rounded bg-ink/10" />
        <div className="mt-8 h-96 rounded-xl bg-ink/8" />
      </div>
    </main>
  );
}
