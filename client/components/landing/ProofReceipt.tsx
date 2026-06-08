"use client";

// @ts-ignore
import { FileCheck, Fingerprint, Clock, Coins, Link2, User } from "lucide-react";

export function ProofReceipt() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            The ProofReceipt NFT
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            OWN YOUR COMPUTE
          </span>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* NFT Card Mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Header */}
              <div className="border-b-2 border-[var(--border-color)] bg-[var(--accent)] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    ProofReceipt
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    #420
                  </span>
                </div>
              </div>

              {/* Visual */}
              <div className="flex aspect-square items-center justify-center border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
                <div className="text-center">
                  <FileCheck className="mx-auto mb-2 h-16 w-16 text-[var(--accent)]" />
                  <div className="font-mono text-xs text-[var(--text-secondary)]">
                    VERIFIED COMPUTE
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                    <Link2 className="h-3 w-3" /> Result CID
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-on-card)]">
                    QmXyZ...a1b2
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                    <Fingerprint className="h-3 w-3" /> Instructions
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-on-card)]">
                    2.4 Billion
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                    <Coins className="h-3 w-3" /> Cost
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-on-card)]">
                    45 XDC
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                    <User className="h-3 w-3" /> Provider
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-on-card)]">
                    0x71...3f9a
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                    <Clock className="h-3 w-3" /> Verified
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-on-card)]">
                    Block #154320
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-6">
            <p className="font-mono text-lg leading-relaxed text-[var(--text-primary)]">
              A non-transferable ERC-721 NFT minted upon job completion. Your
              permanent, on-chain certificate of computation.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: "Auditability",
                  desc: "Anyone can verify what was computed, when, and by whom.",
                },
                {
                  title: "Reproducibility",
                  desc: "Pin exact Docker image + dataset for re-runs and peer review.",
                },
                {
                  title: "Citable",
                  desc: "Cite your on-chain proof in research papers. Token ID + contract address.",
                },
                {
                  title: "Compliance",
                  desc: "Regulatory proof of computation for sensitive workloads.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-l-4 border-[var(--accent)] bg-[var(--bg-card)] p-4"
                >
                  <div className="mb-1 font-mono text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
                    {item.title}
                  </div>
                  <div className="font-mono text-sm text-[var(--text-on-card)]">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
