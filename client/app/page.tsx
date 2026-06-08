"use client";

import { Button } from "@/components/ui/button";
import { GlobeGpu } from "@/components/ui/cobe-globe-gpu";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTheme } from "@/context/ThemeContext";

import { StatsBar } from "@/components/landing/StatsBar";
import { WhyDiCompute } from "@/components/landing/WhyDiCompute";
import { ProofReceipt } from "@/components/landing/ProofReceipt";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Providers } from "@/components/landing/Providers";
import { UseCases } from "@/components/landing/UseCases";
import { CTA } from "@/components/landing/CTA";

export default function Home() {
  const { theme, mounted } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="grid items-center gap-0 md:grid-cols-[1fr_1fr]">
              <div className="max-w-4xl">
                <div className="mb-6 inline-block border-2 border-[var(--border-color)] bg-[var(--accent)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-black">
                  XDC Apothem Testnet
                </div>
                <h1 className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter text-[var(--text-primary)] md:text-7xl lg:text-8xl">
                  Verifiable
                  <br />
                  GPU Compute
                </h1>
                <p className="mb-10 max-w-2xl font-mono text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                  Submit ML training jobs. Providers execute them with Docker + GPU.
                  Every heartbeat and result is cryptographically proven on-chain.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/wizard">
                    <Button size="lg" className="gap-2">
                      Submit Job
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/explorer">
                    <Button size="lg" variant="outline">
                      Explore Jobs
                    </Button>
                  </Link>
                </div>
              </div>

              {mounted && (
                <div className="relative hidden h-[650px] items-center justify-center overflow-visible md:-ml-4 md:flex">
                  <GlobeGpu className="h-full w-full" isDark={theme === "dark"} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 1. Stats Bar */}
        <StatsBar />

        {/* 2. Why DiCompute */}
        <WhyDiCompute />

        {/* 3. ProofReceipt NFT */}
        <ProofReceipt />

        {/* 4. How It Works */}
        <HowItWorks />

        {/* 5. Pricing */}
        <Pricing />

        {/* 6. Top Providers */}
        <Providers />

        {/* 7. Use Cases */}
        <UseCases />

        {/* 8. CTA */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
