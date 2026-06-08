"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { Coins, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/marketplace", label: "GPUs" },
  { href: "/wizard", label: "SUBMIT" },
  { href: "/explorer", label: "EXPLORE" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/provider", label: "PROVIDER" },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { address } = useAccount();
  const { data: xdcBalance } = useBalance({ address, query: { enabled: !!address } });

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--border-color)] bg-[var(--navbar-bg)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono font-bold text-lg">
            D
          </div>
          <span className="hidden text-xl font-bold tracking-tighter text-[var(--text-primary)] sm:inline-block">
            DICOMPUTE
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-xs font-bold tracking-wide border-2 transition-all ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-primary)] hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {address && xdcBalance && (
            <div className="hidden sm:flex items-center gap-2 border-2 border-[var(--border-color)] bg-[var(--accent)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--text-primary)]">
              <Coins className="h-3 w-3" />
              {parseFloat(xdcBalance.formatted).toFixed(2)} XDC
            </div>
          )}
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-[2px] border-[1.5px] border-[#0a0a0a] ${
              theme === "dark"
                ? "bg-[#0a0a0a] text-[#f5c800] hover:bg-[#1a1a1a]"
                : "bg-transparent text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
            }`}
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
