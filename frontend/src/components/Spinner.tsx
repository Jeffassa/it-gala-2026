export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-block border-2 border-line border-t-gold rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center text-ink-muted">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <span className="text-sm">Chargement…</span>
      </div>
    </div>
  );
}
