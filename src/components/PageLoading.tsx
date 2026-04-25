export function PageLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-3 text-[12px] text-ink-muted">
        <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
        Loading…
      </div>
    </div>
  );
}
