"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Cpu, Star, Globe, CheckCircle, Zap, Filter, Search, ArrowRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface GPUProvider {
  address: string;
  metadata_uri: string;
  stake: string;
  is_registered: boolean;
  is_slashed: boolean;
  total_jobs_completed: number;
  total_jobs_failed: number;
  // Extended fields (mock for demo, populated from metadata or hardcoded)
  gpu_name?: string;
  vram_gb?: number;
  cuda_cores?: number;
  price_per_hour?: number;
  location?: string;
  reputation?: number;
  available?: boolean;
  benchmark_score?: number;
}

// Demo GPU data for providers that don't have metadata
const demoGPUData: Record<string, Partial<GPUProvider>> = {
  default: {
    gpu_name: "NVIDIA RTX 4090",
    vram_gb: 24,
    cuda_cores: 16384,
    price_per_hour: 0.45,
    location: "US-East",
    reputation: 4.9,
    available: true,
    benchmark_score: 28500,
  },
};

const locations = ["All", "US-East", "US-West", "EU-West", "EU-Central", "AP-South"];
const gpuTypes = ["All", "RTX 4090", "RTX 3090", "A100", "RTX 4080", "AMD MI250X"];

function enrichProvider(provider: GPUProvider): GPUProvider {
  // Try to parse metadata_uri as JSON
  let extra: Partial<GPUProvider> = {};
  try {
    if (provider.metadata_uri?.startsWith("{")) {
      extra = JSON.parse(provider.metadata_uri);
    }
  } catch {
    // not JSON, treat as plain string
  }
  // Fallback to demo data based on address hash for variety
  const hash = provider.address.slice(-4);
  const gpuVariants = [
    { gpu_name: "NVIDIA RTX 4090", vram_gb: 24, cuda_cores: 16384, price_per_hour: 0.45, location: "US-East", reputation: 4.9, benchmark_score: 28500 },
    { gpu_name: "NVIDIA RTX 3090", vram_gb: 24, cuda_cores: 10496, price_per_hour: 0.32, location: "EU-West", reputation: 4.7, benchmark_score: 19500 },
    { gpu_name: "NVIDIA A100", vram_gb: 80, cuda_cores: 6912, price_per_hour: 1.20, location: "AP-South", reputation: 4.8, benchmark_score: 42000 },
    { gpu_name: "NVIDIA RTX 4080", vram_gb: 16, cuda_cores: 9728, price_per_hour: 0.38, location: "US-West", reputation: 4.5, benchmark_score: 22000 },
    { gpu_name: "AMD MI250X", vram_gb: 128, cuda_cores: 14080, price_per_hour: 0.95, location: "EU-Central", reputation: 4.6, benchmark_score: 38000 },
    { gpu_name: "NVIDIA RTX 4070", vram_gb: 12, cuda_cores: 5888, price_per_hour: 0.22, location: "US-East", reputation: 4.3, benchmark_score: 15500 },
  ];
  const variantIndex = parseInt(hash, 16) % gpuVariants.length;
  const fallback = gpuVariants[variantIndex];
  return {
    ...provider,
    ...fallback,
    ...extra,
    available: provider.is_registered && !provider.is_slashed,
  };
}

export default function MarketplacePage() {
  const [providers, setProviders] = useState<GPUProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("All");
  const [gpuFilter, setGpuFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/providers`);
        if (res.ok) {
          const data = await res.json();
          const enriched = data.map(enrichProvider);
          setProviders(enriched);
        } else {
          // Fallback to demo data if API fails
          setProviders([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filteredProviders = providers.filter((p) => {
    if (locationFilter !== "All" && p.location !== locationFilter) return false;
    if (gpuFilter !== "All" && !p.gpu_name?.includes(gpuFilter)) return false;
    if (searchQuery && !p.gpu_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeProviders = providers.filter((p) => p.is_registered && !p.is_slashed);
  const totalVRAM = providers.reduce((sum, p) => sum + (p.vram_gb || 0), 0);
  const avgPrice = providers.length > 0 ? providers.reduce((sum, p) => sum + (p.price_per_hour || 0), 0) / providers.length : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-on-card)]">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl">
              <div className="mb-4 inline-block border-2 border-yellow-400 bg-yellow-400 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-black">
                GPU Marketplace
              </div>
              <h1 className="mb-4 text-4xl font-black uppercase leading-[0.9] tracking-tighter md:text-6xl">
                Rent GPU
                <br />
                Power
              </h1>
              <p className="mb-8 max-w-2xl font-mono text-lg leading-relaxed text-[var(--text-secondary)]">
                Browse verified providers. Pick the perfect GPU for your AI training job.
                Pay per hour. Download your trained model. Get on-chain proof.
              </p>
                <div className="flex flex-wrap gap-6 font-mono text-sm text-[var(--text-on-card)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-400" />
                  <span>{activeProviders.length} GPUs Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-400" />
                  <span>{totalVRAM} GB Total VRAM</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-400" />
                  <span>From ${avgPrice.toFixed(2)}/hr</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <Filter className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Location:</span>
                {locations.map((loc) => (
                  <Button
                    key={loc}
                    variant={locationFilter === loc ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter(loc)}
                    className={locationFilter === loc ? "bg-[var(--bg-card)] text-[var(--text-on-card)] border-[var(--bg-card)]" : "bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"}
                  >
                    {loc}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                  type="text"
                  placeholder="Search GPUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-9 py-2 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-[var(--text-primary)]">
            <span className="font-mono text-xs font-bold uppercase">GPU Type:</span>
            {gpuTypes.map((gpu) => (
              <Button
                key={gpu}
                variant={gpuFilter === gpu ? "default" : "outline"}
                size="sm"
                onClick={() => setGpuFilter(gpu)}
                className={gpuFilter === gpu ? "bg-[var(--bg-card)] text-[var(--text-on-card)] border-[var(--bg-card)]" : "bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"}
              >
                {gpu}
              </Button>
            ))}
          </div>

          {/* GPU Grid */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-20 font-mono text-muted-foreground">
              <Zap className="h-4 w-4 animate-pulse" />
              Loading GPU providers...
            </div>
          )}

          {!loading && filteredProviders.length === 0 && (
            <div className="py-20 text-center">
              <Cpu className="mx-auto mb-4 h-12 w-12 text-[var(--text-secondary)]" />
              <p className="font-mono text-lg text-[var(--text-secondary)]">No GPUs match your filters.</p>
              <p className="mt-2 font-mono text-sm text-[var(--text-secondary)]">
                Try a different location or GPU type.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <Card key={provider.address} className="border-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <CardHeader className="bg-[var(--bg-card)] text-[var(--text-on-card)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border-2 border-[var(--text-on-card)] bg-[var(--text-on-card)] text-[var(--bg-card)]">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{provider.gpu_name}</CardTitle>
                        <div className="font-mono text-xs text-[var(--text-secondary)]">
                          {provider.address.slice(0, 8)}...{provider.address.slice(-6)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={provider.available ? "default" : "secondary"}
                      className={
                        provider.available
                          ? "bg-green-500 text-white border-none"
                          : ""
                      }
                    >
                      {provider.available ? "AVAILABLE" : "BUSY"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 text-[var(--text-primary)]">
                    <div className="border-2 border-[var(--border-color)] p-3">
                      <div className="font-mono text-xs font-bold uppercase text-[var(--text-secondary)]">VRAM</div>
                      <div className="text-xl font-black text-[var(--text-primary)]">{provider.vram_gb} GB</div>
                    </div>
                    <div className="border-2 border-[var(--border-color)] p-3">
                      <div className="font-mono text-xs font-bold uppercase text-[var(--text-secondary)]">CUDA Cores</div>
                      <div className="text-xl font-black text-[var(--text-primary)]">{(provider.cuda_cores || 0).toLocaleString()}</div>
                    </div>
                    <div className="border-2 border-[var(--border-color)] p-3">
                      <div className="font-mono text-xs font-bold uppercase text-[var(--text-secondary)]">Location</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{provider.location}</div>
                    </div>
                    <div className="border-2 border-[var(--border-color)] p-3">
                      <div className="font-mono text-xs font-bold uppercase text-[var(--text-secondary)]">Benchmark</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{(provider.benchmark_score || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Reputation */}
                  <div className="flex items-center justify-between text-[var(--text-primary)]">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-mono font-bold">{provider.reputation}</span>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        ({provider.total_jobs_completed} jobs)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
                      <span className="font-mono text-xs text-[var(--text-secondary)]">{provider.location}</span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between border-t-2 border-[var(--border-color)] pt-4 text-[var(--text-primary)]">
                    <div>
                      <div className="font-mono text-xs text-[var(--text-secondary)]">PRICE</div>
                      <div className="text-2xl font-black text-green-600">
                        ${provider.price_per_hour?.toFixed(2)}/hr
                      </div>
                    </div>
                    <Link
                      href={`/wizard?provider=${provider.address}&gpu=${encodeURIComponent(provider.gpu_name || "")}&price=${provider.price_per_hour}&vram=${provider.vram_gb}&cuda=${provider.cuda_cores}`}
                    >
                      <Button
                        size="lg"
                        className="gap-2"
                        disabled={!provider.available}
                      >
                        Rent GPU
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to action for providers */}
          <div className="mt-12 border-2 border-[var(--border-color)] bg-[#f5c800] p-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="text-[var(--text-primary)]">
                <h3 className="text-2xl font-black uppercase tracking-tight">Have a GPU?</h3>
                <p className="mt-1 font-mono text-[var(--text-secondary)]">
                  Register your GPU and earn DICO tokens for every job you complete.
                </p>
              </div>
              <Link href="/provider">
                <Button className="bg-[var(--bg-card)] text-[var(--text-on-card)] hover:bg-[var(--bg-card)]/80">
                  Become a Provider
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
