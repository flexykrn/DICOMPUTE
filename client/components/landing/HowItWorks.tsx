"use client";

// @ts-ignore
import { Cog, Lock, Zap, Trophy } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "CONFIGURE",
    desc: "Pick your GPU, set your Docker image, upload your dataset. Define CPU, RAM, VRAM, and duration.",
    icon: Cog,
  },
  {
    num: "02",
    title: "LOCK DEPOSIT",
    desc: "Lock XDC in the JobEscrow smart contract. Funds are held securely until job completion.",
    icon: Lock,
  },
  {
    num: "03",
    title: "EXECUTE",
    desc: "Provider claims your job and runs the container. EIP-712 heartbeats every 30s prove live execution.",
    icon: Zap,
  },
  {
    num: "04",
    title: "PROVE & MINT",
    desc: "Receive your ProofReceipt NFT with result CID, instruction count, cost, and provider address.",
    icon: Trophy,
  },
];

export function HowItWorks() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            How It Works
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            NO TRUST REQUIRED
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="border-b-2 border-[var(--border-color)] bg-[var(--accent)] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Step {step.num}
                  </span>
                  <step.icon className="h-4 w-4 text-[var(--text-primary)]" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--text-on-card)]">
                  {step.title}
                </h3>
                <p className="font-mono text-sm leading-relaxed text-[var(--text-on-card)]/80">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
