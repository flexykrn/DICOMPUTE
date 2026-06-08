"use client";

// @ts-ignore
import { CheckCircle2, XCircle } from "lucide-react";

const features = [
  { name: "Proof of Execution", dicompute: true, akash: false, cloud: false },
  { name: "Cryptographic Verification", dicompute: true, akash: false, cloud: false },
  { name: "2s Block Time", dicompute: true, akash: false, cloud: false },
  { name: "ML Training Optimized", dicompute: true, akash: false, cloud: false },
  { name: "On-chain Pricing", dicompute: true, akash: true, cloud: false },
  { name: "Censorship Resistant", dicompute: true, akash: true, cloud: false },
  { name: "ProofReceipt NFT", dicompute: true, akash: false, cloud: false },
  { name: "EIP-712 Heartbeats", dicompute: true, akash: false, cloud: false },
];

export function WhyDiCompute() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            Why DiCompute?
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            BUILT DIFFERENT
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden border-2 border-[var(--border-color)] md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th className="px-6 py-4 text-left font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Feature
                </th>
                <th className="px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  DiCompute
                </th>
                <th className="px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Akash
                </th>
                <th className="px-6 py-4 text-center font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Traditional Cloud
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {features.map((f) => (
                <tr key={f.name} className="bg-[var(--bg-card)]">
                  <td className="px-6 py-3 font-mono text-sm font-bold text-[var(--text-on-card)]">
                    {f.name}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {f.dicompute ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-[var(--accent)]" />
                    ) : (
                      <XCircle className="mx-auto h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {f.akash ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-[var(--accent)]" />
                    ) : (
                      <XCircle className="mx-auto h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {f.cloud ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-[var(--accent)]" />
                    ) : (
                      <XCircle className="mx-auto h-5 w-5 text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {features.map((f) => (
            <div
              key={f.name}
              className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] p-4"
            >
              <div className="mb-2 font-mono text-sm font-bold text-[var(--text-on-card)]">
                {f.name}
              </div>
              <div className="flex justify-between gap-2">
                <div className="flex items-center gap-1">
                  {f.dicompute ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    DiCompute
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {f.akash ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    Akash
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {f.cloud ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    Cloud
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
