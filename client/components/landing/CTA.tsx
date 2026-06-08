"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)] py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-6 text-4xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-6xl">
          Compute Without Compromise
        </h2>
        <p className="mx-auto mb-10 max-w-2xl font-mono text-lg text-[var(--text-secondary)]">
          DiCompute is the first decentralized compute marketplace with
          cryptographic proof of execution. Rent GPU power. Earn passive income.
          Trust math, not promises.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/marketplace">
            <span className="inline-flex items-center gap-2 border-2 border-[var(--border-color)] bg-[var(--accent)] px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <ArrowRight className="h-4 w-4" />
              Start Computing
            </span>
          </Link>
          <Link href="/provider">
            <span className="inline-flex items-center gap-2 border-2 border-[var(--border-color)] bg-[var(--bg-card)] px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-on-card)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              Become a Provider
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
