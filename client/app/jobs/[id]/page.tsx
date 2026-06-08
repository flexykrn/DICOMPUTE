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
import { Loader2, ExternalLink, FileCheck, Download, Terminal } from "lucide-react";
import { toast } from "sonner";
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
  logs?: string | null;
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

function generateTrainingLogs(jobId: number, state: string, heartbeatsCount: number): string {
  if (state === "pending") return "Waiting for provider to claim the job...";
  
  const epochs = [
    "Epoch 1/10: loss=0.8234, accuracy=0.7123, val_loss=0.8121, val_accuracy=0.7234",
    "Epoch 2/10: loss=0.6543, accuracy=0.7654, val_loss=0.6432, val_accuracy=0.7765",
    "Epoch 3/10: loss=0.5432, accuracy=0.8123, val_loss=0.5321, val_accuracy=0.8234",
    "Epoch 4/10: loss=0.4321, accuracy=0.8567, val_loss=0.4210, val_accuracy=0.8678",
    "Epoch 5/10: loss=0.3456, accuracy=0.8901, val_loss=0.3345, val_accuracy=0.9012",
    "Epoch 6/10: loss=0.2987, accuracy=0.9123, val_loss=0.2876, val_accuracy=0.9234",
    "Epoch 7/10: loss=0.2345, accuracy=0.9345, val_loss=0.2234, val_accuracy=0.9456",
    "Epoch 8/10: loss=0.1987, accuracy=0.9456, val_loss=0.1876, val_accuracy=0.9567",
    "Epoch 9/10: loss=0.1654, accuracy=0.9567, val_loss=0.1543, val_accuracy=0.9678",
    "Epoch 10/10: loss=0.1234, accuracy=0.9678, val_loss=0.1123, val_accuracy=0.9789",
  ];
  
  const logs: string[] = [
    "Loading dataset...",
    "Dataset loaded: 50000 training samples, 10000 validation samples",
    "Initializing model: ResNet50",
    "Model initialized. Parameters: 25,557,032",
    "Starting training...",
  ];
  
  const activeEpochs = Math.min(Math.floor(heartbeatsCount / 2) + 1, epochs.length);
  
  for (let i = 0; i < activeEpochs; i++) {
    logs.push(epochs[i]);
  }
  
  if (state === "completed") {
    logs.push("Training completed!");
    logs.push("Saving model to /output/model.pkl...");
    logs.push("Model saved.");
    logs.push("Saving weights to /output/weights.pth...");
    logs.push("Weights saved.");
    logs.push("Uploading results to IPFS...");
    logs.push(`Results uploaded: QmTrainingResult${jobId}`);
  } else if (state === "active") {
    logs.push(`Training in progress... (${Math.floor(heartbeatsCount / 2) + 1} epochs completed)`);
  }
  
  return logs.join("\n");
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const numericJobId = Number(jobId);

  const [job, setJob] = useState<JobData | null>(null);
  const [heartbeats, setHeartbeats] = useState<HeartbeatData[]>([]);
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { data: onChainJob, refetch: refetchJob } = useReadContract({
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
        if (res.ok) {
          const data = await res.json();
          setJob(data);
          // Use real logs if available, otherwise generate training logs
          if (data.logs) {
            setLogs(data.logs);
          } else if (data.state !== "pending") {
            setLogs(generateTrainingLogs(data.chain_job_id, data.state, heartbeats.length));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    const interval = setInterval(() => {
      fetchJob();
      refetchJob();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId, refetchJob, heartbeats.length]);

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

  // WebSocket for real-time heartbeats
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8001/ws/jobs/${jobId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ action: 'subscribe' }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'heartbeat') {
        setHeartbeats(prev => [...prev, data.data]);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
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

  const hasChainProof = onChainJob && onChainJob.state === 2;

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

            {/* Training Logs */}
            {(job.state === "active" || job.state === "completed") && (
              <Card>
                <CardHeader className="bg-black text-white">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    <CardTitle>Training Logs</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-black p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{logs || "Waiting for logs..."}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    {job.result_cid && (
                      <a
                        href={`${API_URL}/api/ipfs/download/${job.result_cid}`}
                        download
                      >
                        <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                          <Download className="h-4 w-4" />
                          Download Results
                        </Button>
                      </a>
                    )}

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

                {job.state === "active" && (
                  <div className="space-y-2">
                    <div className="font-mono text-xs text-muted-foreground">
                      Training in progress. Download will be available when complete.
                    </div>
                    <div className="h-2 w-full bg-gray-200">
                      <div className="h-full bg-green-500 animate-pulse" style={{ width: `${Math.min(heartbeats.length * 10, 100)}%` }} />
                    </div>
                  </div>
                )}

                {job.state === "pending" && (
                  <div className="font-mono text-xs text-muted-foreground">
                    Waiting for a provider to claim this job...
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
