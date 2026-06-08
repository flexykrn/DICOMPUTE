"use client";

// @ts-ignore
import { GitBranch, Globe, MessageSquare } from "lucide-react";
import Link from "next/link";

const links = {
  product: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "My Jobs", href: "/my-jobs" },
    { label: "Provider Dashboard", href: "/provider" },
    { label: "ProofReceipts", href: "/receipts" },
  ],
  resources: [
    { label: "GitHub", href: "https://github.com/dicompute" },
    { label: "Docs", href: "#" },
    { label: "Whitepaper", href: "#" },
    { label: "Blog", href: "#" },
  ],
  social: [
    { label: "Twitter", href: "#", icon: Globe },
    { label: "Discord", href: "#", icon: MessageSquare },
    { label: "GitHub", href: "#", icon: GitBranch },
  ],
};

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4 text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">
              DiCompute
            </div>
            <p className="font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
              Decentralized GPU marketplace with cryptographic proof of
              execution. Built on XDC Network.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Product
            </div>
            <ul className="space-y-2">
              {links.product.map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Resources
            </div>
            <ul className="space-y-2">
              {links.resources.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Community
            </div>
            <div className="flex gap-3">
              {links.social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex h-10 w-10 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t-2 border-[var(--border-color)] pt-6 text-center font-mono text-xs text-[var(--text-secondary)]">
          © 2026 DiCompute. Built on XDC Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
