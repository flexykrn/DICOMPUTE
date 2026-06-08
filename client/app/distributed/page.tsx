"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Cpu, Layers, Network, Shield, ArrowRight, Globe, Server, Database } from "lucide-react";
import Link from "next/link";

export default function DistributedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b-2 border-black">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl">
              <Badge className="mb-4 bg-yellow-400 text-black hover:bg-yellow-400 font-mono text-xs">
                ARCHITECTURE READY
              </Badge>
              <h1 className="mb-6 text-4xl font-black uppercase leading-[0.9] tracking-tighter md:text-6xl lg:text-7xl">
                Distributed
                <br />
                AI Training
              </h1>
              <p className="mb-8 max-w-2xl font-mono text-lg leading-relaxed text-muted-foreground">
                Train massive AI models across thousands of GPUs. Your data is split, 
                distributed, and computed in parallel — with every result verified on-chain.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/wizard">
                  <Button size="lg" className="gap-2">
                    Submit Training Job
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/provider">
                  <Button size="lg" variant="outline">
                    Join as Provider
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">How It Works</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Job Splitting",
                desc: "Your training job is automatically partitioned into shards based on data and compute requirements.",
                icon: Layers,
              },
              {
                step: "02",
                title: "Provider Matching",
                desc: "Each shard is matched to optimal providers based on GPU specs, reputation, and geographic proximity.",
                icon: Network,
              },
              {
                step: "03",
                title: "Parallel Execution",
                desc: "All providers execute their shards simultaneously. Heartbeats verify active compute every block.",
                icon: Cpu,
              },
              {
                step: "04",
                title: "On-Chain Aggregation",
                desc: "Results are cryptographically verified and aggregated. Final model returned with ProofReceipt NFT.",
                icon: Shield,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-black text-white">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-2 font-mono text-xs font-bold text-muted-foreground">
                    STEP {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-black uppercase">{item.title}</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Network Visualization */}
        <section className="border-t-2 border-black bg-black text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="mb-10 border-b-2 border-white/20 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tight">Global Compute Network</h2>
              <p className="mt-2 font-mono text-sm text-white/60">
                Providers around the world contributing GPU power to the network.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="aspect-[2/1] border-2 border-white/20 bg-[#111] relative overflow-hidden">
                  {/* Mock world map dots */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-8 gap-8 opacity-30">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            [0, 3, 7, 12, 15, 18, 22, 25, 28, 31].includes(i)
                              ? "bg-green-400 animate-pulse"
                              : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 font-mono text-xs text-white/60">
                    Live provider nodes: 47
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-2 border-white/20 bg-transparent text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="font-mono text-xs text-white/60">Regions</div>
                        <div className="font-bold">North America, Europe, Asia</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-white/20 bg-transparent text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="font-mono text-xs text-white/60">Avg GPU Power</div>
                        <div className="font-bold">24 GB VRAM per node</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-white/20 bg-transparent text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-mono text-xs text-white/60">Total Compute</div>
                        <div className="font-bold">1,128 TFLOPS available</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">Technical Specifications</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fault Tolerance</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-muted-foreground space-y-2">
                <p>• Automatic shard reassignment on provider failure</p>
                <p>• Checkpoint-based recovery every 100 blocks</p>
                <p>• Redundant computation for critical paths</p>
                <p>• Slashing mechanism ensures provider accountability</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Communication Layer</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-muted-foreground space-y-2">
                <p>• Gossip protocol for model update exchange</p>
                <p>• Bandwidth-optimized gradient compression</p>
                <p>• End-to-end encryption for all transfers</p>
                <p>• NAT traversal for peer-to-peer connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Consensus Mechanism</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-muted-foreground space-y-2">
                <p>• Proof-of-Compute verification via heartbeats</p>
                <p>• Result validation using deterministic checks</p>
                <p>• Multi-provider consensus for aggregation</p>
                <p>• Dispute resolution via on-chain arbitration</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Scaling Limits</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-muted-foreground space-y-2">
                <p>• Up to 10,000 concurrent providers</p>
                <p>• Job shards: minimum 1, maximum 1024</p>
                <p>• Heartbeat frequency: configurable (default 5 blocks)</p>
                <p>• Result aggregation: O(log n) complexity</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
