"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { JOB_ESCROW_ADDRESS, jobEscrowAbi } from "@/lib/contracts/JobEscrow";
import { Loader2, ExternalLink, FileCheck } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface HeartbeatData {
  block_number: number;
  cpu_percent: number;
  ram_percent: number;
  vram_percent: number;
}

interface JobData {
  chain_job_id: number;
  user_address: string;
  provider_address: string | null;
  docker_uri: string;
  cpu_milli: number;
  ram_mib: number;
  vram_mib: number;
  duration_blocks: number;
  max_price_per_block: string;
  state: string;
  deposit: string;
  result_cid: string | null;
  instruction_count: number | null;
  started_at_block: number | null;
  completed_at_block: number | null;
  last_heartbeat_block: number | null;
}

function getStatusVariant(state: string) {
  switch (state) {
    case "pending": return "secondary";
    case "active": return "accent";
    case "completed": return "default";
    case "slashed": return "destructive";
    default: return "outline";
  }
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const numericJobId = Number(jobId);

  const [job, setJob] = useState<JobData | null>(null);
  const [heartbeats, setHeartbeats] = useState<HeartbeatData[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: onChainJob } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: jobEscrowAbi,
    functionName: "getJob",
    args: [BigInt(numericJobId)],
    query: { enabled: numericJobId > 0 },
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
        if (res.ok) setJob(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  useEffect(() => {
    const fetchHeartbeats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}/heartbeats`);
        if (res.ok) setHeartbeats(await res.json());
      } catch (e) {
        console.error(e);
      }
    };

    fetchHeartbeats();
    const interval = setInterval(fetchHeartbeats, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
        <Navigation />
        <main className="flex flex-1 items-center justify-center font-mono">
          Job not found
        </main>
        <Footer />
      </div>
    );
  }

  const hasChainProof = onChainJob && onChainJob.state === 2; // state Completed == 2

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href="/explorer" className="hover:underline">EXPLORER</Link>
          <span>/</span>
          <span className="font-bold text-black">JOB #{jobId}</span>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Job #{jobId}
          </h1>
          <Badge variant={getStatusVariant(job.state)} className="w-fit text-base">
            {job.state.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Job spec */}
            <Card>
              <CardHeader>
                <CardTitle>Job Specification</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {
                  [
                    { label: "Docker URI", value: job.docker_uri },
                    { label: "User", value: job.user_address },
                    { label: "Provider", value: job.provider_address || "Unassigned" },
                    { label: "CPU", value: `${job.cpu_milli} milli` },
                    { label: "RAM", value: `${job.ram_mib} MiB` },
                    { label: "VRAM", value: `${job.vram_mib} MiB` },
                    { label: "Duration", value: `${job.duration_blocks} blocks` },
                    { label: "Max Price/Block", value: `${job.max_price_per_block} wei` },
                    { label: "Deposit", value: `${(Number(job.deposit) / 1e18).toFixed(6)} XDC` },
                    { label: "Last Heartbeat", value: job.last_heartbeat_block?.toString() || "—" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">
                        {item.label}
                      </div>
                      <div className={`break-all font-mono text-sm ${item.label === "Docker URI" ? "font-bold" : ""}`}>
                        {item.value}
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>

            {/* On-chain proof */}
            <Card>
              <CardHeader className="bg-yellow-400 text-black">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  <CardTitle>On-Chain Proof</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!onChainJob && (
                  <div className="font-mono text-sm text-muted-foreground">
                    Fetching on-chain data...
                  </div>
                )}

                {onChainJob && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Chain State</div>
                        <div className="font-mono text-sm font-bold">
                          {onChainJob.state === 0 && "PENDING"}
                          {onChainJob.state === 1 && "ACTIVE"}
                          {onChainJob.state === 2 && "COMPLETED"}
                          {onChainJob.state === 3 && "SLASHED"}
                          {onChainJob.state === 4 && "CANCELLED"}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">On-Chain Provider</div>
                        <div className="break-all font-mono text-sm">{onChainJob.provider}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Started at Block</div>
                        <div className="font-mono text-sm">{onChainJob.startedAt > 0n ? onChainJob.startedAt.toString() : "—"}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Completed at Block</div>
                        <div className="font-mono text-sm">{onChainJob.completedAt > 0n ? onChainJob.completedAt.toString() : "—"}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Result CID</div>
                        <div className="break-all font-mono text-sm font-bold">{onChainJob.resultCID || "—"}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Instruction Count</div>
                        <div className="font-mono text-sm">{onChainJob.instructionCount > 0n ? onChainJob.instructionCount.toLocaleString() : "—"}</div>
                      </div>
                    </div>

                    <a
                      href={`https://explorer.apothem.network/address/${JOB_ESCROW_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider hover:underline"
                    >
                      Verify contract on XDC Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Heartbeats */}
            {heartbeats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Heartbeats ({heartbeats.length})</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full border-collapse font-mono text-sm">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-2 text-left">Block</th>
                        <th className="py-2 text-left">CPU%</th>
                        <th className="py-2 text-left">RAM%</th>
                        <th className="py-2 text-left">VRAM%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heartbeats.map((hb, idx) => (
                        <tr key={idx} className="border-b border-black/10">
                          <td className="py-2">{hb.block_number}</td>
                          <td className="py-2">{hb.cpu_percent}%</td>
                          <td className="py-2">{hb.ram_percent}%</td>
                          <td className="py-2">{hb.vram_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.state === "completed" && (
                  <>
                    <Link href={`/receipts/${job.chain_job_id}`}>
                      <Button className="w-full">
                        View ProofReceipt NFT
                      </Button>
                    </Link>

                    <a
                      href={`https://explorer.apothem.network/address/${JOB_ESCROW_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full">
                        View on XDC Explorer
                      </Button>
                    </a>
                  </>
                )}

                {job.state !== "completed" && (
                  <div className="font-mono text-xs text-muted-foreground">
                    Receipt NFT will be available after the provider submits results on-chain.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 border-2 border-black ${job.state === "pending" || job.state !== "pending" ? "bg-black" : ""}`} />
                  <span>Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 border-2 border-black ${job.state === "active" || job.state === "completed" || job.state === "slashed" ? "bg-black" : ""}`} />
                  <span>Claimed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 border-2 border-black ${job.state === "completed" ? "bg-black" : ""}`} />
                  <span>Completed</span>
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
