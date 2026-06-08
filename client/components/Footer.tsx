export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <div className="container mx-auto flex flex-col justify-between gap-4 px-4 py-8 md:flex-row md:items-center">
        <div className="font-mono text-sm">
          <span className="font-bold">DICOMPUTE</span> — VERIFIABLE COMPUTE ON XDC APOTHEM
        </div>
      </div>
    </footer>
  );
}
