"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAccount, useBalance } from "wagmi";
import { Terminal, Copy, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface ProviderData {
  address: string;
  metadata_uri: string;
  stake: string;
  is_registered: boolean;
  is_slashed: boolean;
  total_jobs_completed: number;
  total_jobs_failed: number;
}

export default function ProviderPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    const fetchProvider = async () => {
      try {
        const res = await fetch(`${API_URL}/api/providers/${address}`);
        if (res.ok) setProvider(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchProvider();
  }, [address]);

  const copyCommand = () => {
    navigator.clipboard.writeText("cd scripts && python gpu_provider.py");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
            Provider
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Run a GPU provider daemon and earn XDC for compute jobs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-mono text-sm text-muted-foreground">
                  On a machine with Docker and (optionally) a GPU, clone the repo and run:
                </p>

                <div className="flex items-center justify-between border-2 border-black bg-black p-4 font-mono text-sm text-white">
                  <code>cd scripts && python gpu_provider.py</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCommand}
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Terminal className="mt-0.5 h-4 w-4" />
                    <span>The daemon listens for JobSubmitted events on XDC Apothem.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Terminal className="mt-0.5 h-4 w-4" />
                    <span>It claims the job, pulls Docker images, runs containers, and submits results.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Terminal className="mt-0.5 h-4 w-4" />
                    <span>Heartbeats are signed and submitted on-chain every few seconds.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {[
                  "Docker Engine installed",
                  "Python 3.10+ with pip",
                  "XDC Apothem gas funds",
                  "GPURegistry registration + stake",
                  "Public or LAN access to RPC endpoint",
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-sm">
                    <div className="h-2 w-2 bg-black" />
                    {req}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isConnected ? (
                  <div className="font-mono text-sm text-muted-foreground">
                    Connect your wallet to see provider details.
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Address</div>
                      <div className="break-all font-mono text-sm">{address}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Balance</div>
                      <div className="font-mono text-lg font-bold">
                        {balance ? `${Number(balance.value) / 1e18} XDC` : "—"}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {provider ? (
              <Card>
                <CardHeader>
                  <CardTitle>On-Chain Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">Registered</span>
                    <Badge variant={provider.is_registered ? "default" : "secondary"}>
                      {provider.is_registered ? "YES" : "NO"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">Slashed</span>
                    <Badge variant={provider.is_slashed ? "destructive" : "default"}>
                      {provider.is_slashed ? "YES" : "NO"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">Stake</span>
                    <span className="font-mono font-bold">{Number(provider.stake) / 1e18} XDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">Jobs Completed</span>
                    <span className="font-mono font-bold">{provider.total_jobs_completed}</span>
                  </div>
                </CardContent>
              </Card>
            ) : isConnected ? (
              <Card>
                <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
                  This wallet is not registered as a provider.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
