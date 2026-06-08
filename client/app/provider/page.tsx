"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { Cpu, Zap, Globe, ArrowRight, Play, Square, Activity } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dicompute-backend.onrender.com";
const GPU_REGISTRY_ADDRESS = "0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C";

const gpuRegistryAbi = [
  {
    inputs: [
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "registerProvider",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

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
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [providerRunning, setProviderRunning] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("0.1");
  const [gpuName, setGpuName] = useState("NVIDIA RTX 4090");

  const {
    writeContract,
    isPending: isRegistering,
    data: hash,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || "Registration failed");
    }
  }, [writeError]);

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
  }, [address, hash]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/providers`);
        if (res.ok) setProviders(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchProviders();
    const interval = setInterval(fetchProviders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = () => {
    if (!isConnected) {
      toast.info("Connect wallet first");
      return;
    }
    const stake = BigInt(Number(stakeAmount) * 1e18);
    writeContract({
      address: GPU_REGISTRY_ADDRESS,
      abi: gpuRegistryAbi,
      functionName: "registerProvider",
      args: [gpuName],
      value: stake,
      gas: BigInt(500000),
      maxFeePerGas: BigInt(50000000000), // 50 gwei max
    });
  };

  const toggleProvider = () => {
    setProviderRunning(!providerRunning);
    toast.success(providerRunning ? "Provider stopped" : "Provider started (demo mode)");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
            Provider Network
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Share your GPU and earn DICO tokens for every job you complete.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Register Section */}
            <Card>
              <CardHeader>
                <CardTitle>Register Your GPU</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="font-mono text-sm text-muted-foreground">
                    Connect your wallet to register as a provider.
                  </div>
                ) : provider?.is_registered ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">REGISTERED</Badge>
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)]">Your GPU is in the network</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">Stake</div>
                        <div className="font-mono text-lg font-bold">{(Number(provider.stake) / 1e18).toFixed(2)} XDC</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">Jobs Done</div>
                        <div className="font-mono text-lg font-bold">{provider.total_jobs_completed}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">Status</div>
                        <div className="font-mono text-lg font-bold">
                          {provider.is_slashed ? "SLASHED" : "ACTIVE"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleProvider}
                        className={providerRunning ? "bg-red-500" : "bg-green-500"}
                      >
                        {providerRunning ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {providerRunning ? "Stop Provider" : "Start Provider"}
                      </Button>
                      <Link href="/explorer">
                        <Button variant="outline">View Jobs</Button>
                      </Link>
                    </div>
                    <p className="font-mono text-xs text-[var(--text-secondary)]">
                      {providerRunning
                        ? "Provider daemon running. It will auto-claim and execute jobs."
                        : "Click 'Start Provider' to begin accepting jobs."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="font-mono text-xs font-bold uppercase text-[var(--text-primary)]">Stake (XDC)</label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="mt-1 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-xs font-bold uppercase text-[var(--text-primary)]">GPU Name</label>
                        <input
                          type="text"
                          value={gpuName}
                          onChange={(e) => setGpuName(e.target.value)}
                          className="mt-1 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering || isConfirming}
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isRegistering ? "Waiting for wallet..." : isConfirming ? "Confirming..." : "Register Provider"}
                    </Button>
                    {hash && (
                      <div className="border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 font-mono text-xs break-all text-[var(--text-primary)]">
                        TX: {hash}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Network Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.length === 0 && (
                    <div className="py-8 text-center font-mono text-sm text-[var(--text-secondary)]">
                      No providers registered yet. Be the first!
                    </div>
                  )}
                  {providers.map((p) => (
                    <div
                      key={p.address}
                      className="flex items-center justify-between border-b border-black/10 pb-2 last:border-0"
                    >
                      <div>
                        <div className="font-mono text-sm font-bold">
                          {p.address.slice(0, 8)}...{p.address.slice(-6)}
                        </div>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">
                          {p.is_registered ? "Registered" : "Not registered"}
                          {p.is_slashed && " • Slashed"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold">
                          {(Number(p.stake) / 1e18).toFixed(2)} XDC
                        </div>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">
                          {p.total_jobs_completed} jobs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                        {balance ? `${(Number(balance.value) / 1e18).toFixed(4)} XDC` : "—"}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">DICO Balance</span>
                  <span className="font-mono font-bold">0.00 DICO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">XDC Earned</span>
                  <span className="font-mono font-bold">0.00 XDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Jobs Completed</span>
                  <span className="font-mono font-bold">{provider?.total_jobs_completed || 0}</span>
                </div>
                <Badge variant="outline" className="w-full justify-center font-mono text-xs">
                  Rewards distributed on job completion
                </Badge>
              </CardContent>
            </Card>

                <Card className="border-2 border-[var(--accent)]">
              <CardHeader className="bg-[var(--accent)] text-[var(--text-primary)]">
                <CardTitle>Why Provide?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4 font-mono text-sm">
                <div className="flex items-start gap-2">
                  <Cpu className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Monetize idle GPU time</span>
                </div>
                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Earn DICO tokens per job</span>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Join global AI compute network</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Reputation builds over time</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
