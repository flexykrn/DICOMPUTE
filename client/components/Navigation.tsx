"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/wizard", label: "SUBMIT" },
  { href: "/explorer", label: "EXPLORE" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-[#f7f7f5]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-white font-mono font-bold text-lg">
            D
          </div>
          <span className="hidden text-xl font-bold tracking-tighter sm:inline-block">
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
                className={`px-4 py-2 text-sm font-bold tracking-wide border-2 transition-all ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-transparent hover:border-black hover:bg-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
