import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobeGpu } from "@/components/ui/cobe-globe-gpu";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { ArrowRight, Cpu, ShieldCheck, FileCheck } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b-2 border-black bg-[#f5f4f0]">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="grid items-center gap-0 md:grid-cols-[1fr_1fr]">
              <div className="max-w-4xl">
                <div className="mb-6 inline-block border-2 border-black bg-yellow-400 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-black">
                  XDC Apothem Testnet
                </div>
                <h1 className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl">
                  Verifiable
                  <br />
                  GPU Compute
                </h1>
                <p className="mb-10 max-w-2xl font-mono text-lg leading-relaxed text-muted-foreground md:text-xl">
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

              <div className="relative hidden h-[600px] items-center justify-center overflow-hidden pr-0 md:flex">
                <GlobeGpu className="h-full w-full max-h-[560px] max-w-[560px]" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 flex items-end justify-between border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">How It Works</h2>
            <span className="hidden font-mono text-sm text-muted-foreground md:block">NO TRUST REQUIRED</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-white">
                  <Cpu className="h-5 w-5" />
                </div>
                <CardTitle>01 — Submit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  Configure your Docker image, CPU, RAM, and GPU requirements. Lock a deposit in
                  the JobEscrow smart contract.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle>02 — Verify</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  Providers claim jobs on-chain and send cryptographically signed heartbeats
                  directly to the blockchain while your container runs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-white">
                  <FileCheck className="h-5 w-5" />
                </div>
                <CardTitle>03 — Prove</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  Receive an ERC-721 ProofReceipt NFT with the result CID, instruction count,
                  and cost — fully auditable on-chain.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t-2 border-black bg-white">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Ready to compute?</h2>
                <p className="mt-2 font-mono text-muted-foreground">
                  Connect your wallet and submit your first verifiable job.
                </p>
              </div>
              <ConnectButton />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
