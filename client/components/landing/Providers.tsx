"use client";

import { Server, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

const providers = [
  {
    name: "GPU Farm Alpha",
    gpus: "RTX 4090 × 8",
    uptime: "99.9%",
    jobs: 342,
    earnings: "12,450 XDC",
    badge: "TOP EARNER",
  },
  {
    name: "RenderNode Pro",
    gpus: "A100 × 4",
    uptime: "99.7%",
    jobs: 189,
    earnings: "8,920 XDC",
    badge: null,
  },
  {
    name: "CryptoCompute",
    gpus: "RTX 3090 × 12",
    uptime: "99.5%",
    jobs: 267,
    earnings: "7,310 XDC",
    badge: null,
  },
  {
    name: "ML Cluster 01",
    gpus: "RTX 4070 × 16",
    uptime: "99.8%",
    jobs: 198,
    earnings: "5,670 XDC",
    badge: null,
  },
];

export function Providers() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            Top Providers
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            EARN PASSIVE INCOME
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => (
            <div
              key={p.name}
              className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-[var(--accent)]" />
                    <span className="font-mono text-sm font-bold text-[var(--text-on-card)]">
                      {p.name}
                    </span>
                  </div>
                  {p.badge && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {p.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[var(--text-on-card)]">
                  <span className="text-[var(--text-secondary)]">GPUs</span>
                  <span className="font-bold">{p.gpus}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-on-card)]">
                  <span className="text-[var(--text-secondary)]">Uptime</span>
                  <span className="flex items-center gap-1 font-bold text-green-500">
                    <Zap className="h-3 w-3" />
                    {p.uptime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-on-card)]">
                  <span className="text-[var(--text-secondary)]">Jobs Done</span>
                  <span className="font-bold">{p.jobs}</span>
                </div>
                <div className="border-t-2 border-[var(--border-color)] pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Earned</span>
                    <span className="flex items-center gap-1 font-bold text-[var(--accent)]">
                      <TrendingUp className="h-3 w-3" />
                      {p.earnings}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/provider">
            <span className="inline-flex items-center gap-2 border-2 border-[var(--border-color)] bg-[var(--accent)] px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <Server className="h-4 w-4" />
              Become a Provider
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
