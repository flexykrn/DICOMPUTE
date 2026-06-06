"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Users, Eye, ArrowRight, Fingerprint, FileKey, Radio } from "lucide-react";
import Link from "next/link";

export default function FederatedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b-2 border-black">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl">
              <Badge className="mb-4 bg-green-500 text-white hover:bg-green-500 font-mono text-xs">
                PRIVACY FIRST
              </Badge>
              <h1 className="mb-6 text-4xl font-black uppercase leading-[0.9] tracking-tighter md:text-6xl lg:text-7xl">
                Federated
                <br />
                Learning
              </h1>
              <p className="mb-8 max-w-2xl font-mono text-lg leading-relaxed text-muted-foreground">
                Train models collaboratively without sharing raw data. 
                Your data stays local — only encrypted model updates travel across the network.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/wizard">
                  <Button size="lg" className="gap-2">
                    Start Federated Training
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/distributed">
                  <Button size="lg" variant="outline">
                    Learn About Distributed Training
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Promise */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">The Privacy Promise</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Data Never Leaves",
                desc: "Raw training data stays on the provider's device. Only model gradients are shared.",
              },
              {
                icon: Eye,
                title: "Differential Privacy",
                desc: "Mathematical guarantees ensure no individual data point can be reconstructed from updates.",
              },
              {
                icon: Shield,
                title: "Encrypted Updates",
                desc: "All model updates are encrypted end-to-end. Only the aggregation result is decrypted.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-2 border-black">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-green-500 text-white">
                    <item.icon className="h-6 w-6" />
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

        {/* How It Works */}
        <section className="border-t-2 border-black bg-[#e5e5e5]">
          <div className="container mx-auto px-4 py-16">
            <div className="mb-10 border-b-2 border-black pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tight">The Federated Cycle</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Initialize Global Model",
                  desc: "A base model is created and distributed to all participating providers. The model architecture is public; weights are initialized randomly.",
                  icon: FileKey,
                },
                {
                  step: "2",
                  title: "Local Training",
                  desc: "Each provider trains the model on their local data for N epochs. The raw data never leaves their device.",
                  icon: Users,
                },
                {
                  step: "3",
                  title: "Gradient Extraction",
                  desc: "After local training, providers compute model weight updates (gradients). These are compressed and encrypted.",
                  icon: Fingerprint,
                },
                {
                  step: "4",
                  title: "Secure Aggregation",
                  desc: "Encrypted gradients are sent to an aggregation server. The server combines updates without seeing individual contributions.",
                  icon: Radio,
                },
                {
                  step: "5",
                  title: "Model Update",
                  desc: "The aggregated update is applied to the global model. A new round begins with the updated weights.",
                  icon: Shield,
                },
              ].map((item, index) => (
                <Card key={item.step} className="relative">
                  <CardContent className="flex gap-6 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-black text-white font-mono font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-black uppercase">{item.title}</h3>
                      <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </CardContent>
                  {index < 4 && (
                    <div className="absolute bottom-0 left-9 top-full h-6 w-0.5 bg-black" />
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Comparison */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">Security Comparison</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black">
              <thead>
                <tr className="border-b-2 border-black bg-black text-white">
                  <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase">Approach</th>
                  <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase">Data Sharing</th>
                  <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase">Privacy Risk</th>
                  <th className="px-4 py-3 text-left font-mono text-xs font-bold uppercase">Use Case</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                <tr className="border-b border-black/10">
                  <td className="px-4 py-3 font-bold">Centralized</td>
                  <td className="px-4 py-3 text-red-600">All data to central server</td>
                  <td className="px-4 py-3 text-red-600">High — single breach exposes everything</td>
                  <td className="px-4 py-3">Single organization, trusted environment</td>
                </tr>
                <tr className="border-b border-black/10">
                  <td className="px-4 py-3 font-bold">Distributed</td>
                  <td className="px-4 py-3 text-yellow-600">Data splits across nodes</td>
                  <td className="px-4 py-3 text-yellow-600">Medium — partial exposure possible</td>
                  <td className="px-4 py-3">Multi-organization, controlled access</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-4 py-3 font-bold">Federated (DICOMPUTE)</td>
                  <td className="px-4 py-3 text-green-600">Only gradients shared</td>
                  <td className="px-4 py-3 text-green-600">Low — differential privacy guarantees</td>
                  <td className="px-4 py-3">Cross-organization, privacy-critical data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t-2 border-black bg-black text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="mb-4 text-3xl font-black uppercase tracking-tight">
              Ready to Train Privately?
            </h2>
            <p className="mb-8 max-w-2xl mx-auto font-mono text-white/60">
              Start a federated learning job today. Your data stays on your device, 
              while the global model improves from collective intelligence.
            </p>
            <Link href="/wizard">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Launch Training Job
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
