export function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#f7f7f5]">
      <div className="container mx-auto flex flex-col justify-between gap-4 px-4 py-8 md:flex-row md:items-center">
        <div className="font-mono text-sm">
          <span className="font-bold">DICOMPUTE</span> — VERIFIABLE COMPUTE ON XDC APOTHEM
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          CONTRACT: 0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
        </div>
      </div>
    </footer>
  );
}
