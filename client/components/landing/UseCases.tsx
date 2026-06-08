"use client";

// @ts-ignore
import { BrainCircuit, ImageIcon, FlaskConical, TrendingUp } from "lucide-react";

const cases = [
  {
    icon: BrainCircuit,
    title: "AI / ML TRAINING",
    desc: "Train LLMs, diffusion models, and reinforcement learning agents on verified GPU clusters. Pay only for the compute you use.",
    tags: ["PyTorch", "TensorFlow", "JAX"],
  },
  {
    icon: ImageIcon,
    title: "3D RENDERING",
    desc: "Blender, Unreal Engine, and V-Ray rendering jobs with cryptographic proof of execution. No more trust-based render farms.",
    tags: ["Blender", "Unreal", "V-Ray"],
  },
  {
    icon: FlaskConical,
    title: "SCIENTIFIC COMPUTING",
    desc: "Molecular dynamics, CFD simulations, and climate modeling with verifiable results. Cite your ProofReceipt in publications.",
    tags: ["LAMMPS", "OpenFOAM", "GROMACS"],
  },
  {
    icon: TrendingUp,
    title: "FINANCIAL MODELING",
    desc: "Monte Carlo simulations, risk analysis, and backtesting with tamper-proof audit trails for regulatory compliance.",
    tags: ["QuantLib", "NumPy", "Pandas"],
  },
];

export function UseCases() {
  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between border-b-2 border-[var(--border-color)] pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] md:text-4xl">
            Use Cases
          </h2>
          <span className="hidden font-mono text-sm text-[var(--text-secondary)] md:block">
            WHAT YOU CAN BUILD
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cases.map((c) => (
            <div
              key={c.title}
              className="border-2 border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="mb-4 flex items-center gap-3">
                <c.icon className="h-8 w-8 text-[var(--accent)]" />
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-on-card)]">
                  {c.title}
                </h3>
              </div>
              <p className="mb-4 font-mono text-sm leading-relaxed text-[var(--text-on-card)]/80">
                {c.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
