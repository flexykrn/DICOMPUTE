"use client";

import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";

const gpus = [
  { name: "RTX 4070", vram: "12GB", cuda: "5,888", price: "0.22" },
  { name: "RTX 3090", vram: "24GB", cuda: "10,496", price: "0.32" },
  { name: "RTX 4090", vram: "24GB", cuda: "16,384", price: "0.45" },
  { name: "RTX 4080", vram: "16GB", cuda: "9,728", price: "0.38" },
  { name: "A100", vram: "80GB", cuda: "6,912", price: "1.20" },
  { name: "AMD MI250X", vram: "128GB", cuda: "14,080", price: "0.95" },
];

export function Pricing() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            Pricing
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            TRANSPARENT COSTS
          </span>
        </div>

        {/* GPU Table */}
        <div className="mb-8 overflow-hidden border-2 border-[var(--border-color)]">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border-color)] bg-[var(--bg-card)]">
                <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  GPU Type
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  VRAM
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  CUDA Cores
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Price/Hr
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {gpus.map((gpu) => (
                <tr key={gpu.name} className="bg-[var(--bg-primary)]">
                  <td className="px-4 py-3 font-mono text-sm font-bold text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[var(--accent)]" />
                      {gpu.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                    {gpu.vram}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                    {gpu.cuda}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[var(--accent)]">
                    ${gpu.price}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/marketplace">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[var(--text-primary)] hover:text-[var(--accent)]">
                        Rent <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Example + Gas Fees */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Example: Train ResNet-50 for 2 Hours
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between text-[var(--text-on-card)]">
                <span>RTX 4090 @ $0.45/hr × 2</span>
                <span className="font-bold">$0.90</span>
              </div>
              <div className="flex justify-between text-[var(--text-on-card)]">
                <span>Gas fees (submit + complete)</span>
                <span className="font-bold">~$0.0001</span>
              </div>
              <div className="border-t-2 border-[var(--border-color)] pt-2">
                <div className="flex justify-between text-[var(--text-on-card)]">
                  <span className="font-bold uppercase">Total</span>
                  <span className="font-bold text-[var(--accent)]">~$0.90</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Gas Fee Breakdown
            </div>
            <div className="space-y-2 font-mono text-sm text-[var(--text-on-card)]">
              <div className="flex justify-between">
                <span>submitJob()</span>
                <span>~0.001 XDC</span>
              </div>
              <div className="flex justify-between">
                <span>heartbeat (paid by provider)</span>
                <span>~0.0001 XDC</span>
              </div>
              <div className="flex justify-between">
                <span>completeJob()</span>
                <span>~0.001 XDC</span>
              </div>
              <div className="flex justify-between">
                <span>mint ProofReceipt NFT</span>
                <span>~0.001 XDC</span>
              </div>
              <div className="border-t-2 border-[var(--border-color)] pt-2">
                <div className="flex justify-between font-bold text-[var(--accent)]">
                  <span>Total Gas</span>
                  <span>~0.003 XDC (~$0.0001)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
