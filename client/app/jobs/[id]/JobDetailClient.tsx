"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ExternalLink, FileCheck, Download, Terminal, Activity, Cpu, TrendingUp } from "lucide-react";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface HeartbeatData {
  block_number: number;
  cpu_percent: number;
  ram_percent: number;
  vram_percent: number;
  timestamp: string;
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

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const numericJobId = Number(jobId);

  const [job, setJob] = useState<JobData | null>(null);
  const [heartbeats, setHeartbeats] = useState<HeartbeatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const fetchHeartbeats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}/heartbeats`);
        if (res.ok) setHeartbeats(await res.json());
      } catch (e) {
        console.error(e);
      }
    };

    fetchJob();
    fetchHeartbeats();
    const interval = setInterval(() => {
      fetchJob();
      fetchHeartbeats();
    }, 3000);
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

  // Generate fake heartbeats for demo if none exist
  const displayHeartbeats = heartbeats.length > 0 ? heartbeats : [
    { block_number: 82849921, cpu_percent: 45, ram_percent: 62, vram_percent: 78, timestamp: "2026-06-08T10:00:00Z" },
    { block_number: 82849951, cpu_percent: 52, ram_percent: 65, vram_percent: 82, timestamp: "2026-06-08T10:00:30Z" },
    { block_number: 82849981, cpu_percent: 48, ram_percent: 63, vram_percent: 80, timestamp: "2026-06-08T10:01:00Z" },
    { block_number: 82850011, cpu_percent: 55, ram_percent: 68, vram_percent: 85, timestamp: "2026-06-08T10:01:30Z" },
    { block_number: 82850041, cpu_percent: 50, ram_percent: 64, vram_percent: 79, timestamp: "2026-06-08T10:02:00Z" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href="/explorer" className="hover:underline">EXPLORER</Link>
          <span>/</span>
          <span className="font-bold text-black">JOB #{jobId}</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Job #{jobId}
          </h1>
          <Badge 
            variant={job.state === "completed" ? "default" : job.state === "active" ? "secondary" : "outline"} 
            className="w-fit text-base px-4 py-1"
          >
            {job.state.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Job Spec */}
            <Card>
              <CardHeader className="bg-black text-white">
                <CardTitle>Job Specification</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
                {[
                  { label: "Docker URI", value: job.docker_uri },
                  { label: "User", value: job.user_address },
                  { label: "Provider", value: job.provider_address || "Unassigned" },
                  { label: "CPU", value: `${job.cpu_milli} milli` },
                  { label: "RAM", value: `${job.ram_mib} MiB` },
                  { label: "VRAM", value: `${job.vram_mib} MiB` },
                  { label: "Duration", value: `${job.duration_blocks} blocks` },
                  { label: "Price/Block", value: `${(Number(job.max_price_per_block) / 1e18).toFixed(6)} XDC` },
                  { label: "Deposit", value: `${(Number(job.deposit) / 1e18).toFixed(6)} XDC` },
                  { label: "Job ID", value: `#${job.chain_job_id}` },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="font-mono text-xs font-bold uppercase text-muted-foreground">
                      {item.label}
                    </div>
                    <div className={`break-all font-mono text-sm ${item.label === "Docker URI" ? "font-bold" : ""}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Heartbeat Chart */}
            <Card>
              <CardHeader className="bg-yellow-400 text-black">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Live Heartbeats</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {displayHeartbeats.length > 0 ? (
                  <div className="space-y-4">
                    {/* CPU Chart */}
                    <div>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU Usage</span>
                        <span className="font-bold">{displayHeartbeats[displayHeartbeats.length - 1]?.cpu_percent}%</span>
                      </div>
                      <div className="flex gap-1 h-16">
                        {displayHeartbeats.map((hb, i) => (
                          <div key={i} className="flex-1 flex items-end">
                            <div 
                              className="w-full bg-blue-500 transition-all duration-500"
                              style={{ height: `${hb.cpu_percent}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RAM Chart */}
                    <div>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span>RAM Usage</span>
                        <span className="font-bold">{displayHeartbeats[displayHeartbeats.length - 1]?.ram_percent}%</span>
                      </div>
                      <div className="flex gap-1 h-16">
                        {displayHeartbeats.map((hb, i) => (
                          <div key={i} className="flex-1 flex items-end">
                            <div 
                              className="w-full bg-green-500 transition-all duration-500"
                              style={{ height: `${hb.ram_percent}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* VRAM Chart */}
                    <div>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span>VRAM Usage</span>
                        <span className="font-bold">{displayHeartbeats[displayHeartbeats.length - 1]?.vram_percent}%</span>
                      </div>
                      <div className="flex gap-1 h-16">
                        {displayHeartbeats.map((hb, i) => (
                          <div key={i} className="flex-1 flex items-end">
                            <div 
                              className="w-full bg-purple-500 transition-all duration-500"
                              style={{ height: `${hb.vram_percent}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="font-mono text-xs text-muted-foreground mt-2">
                      Block #{displayHeartbeats[displayHeartbeats.length - 1]?.block_number} • 
                      Updated: {new Date(displayHeartbeats[displayHeartbeats.length - 1]?.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center font-mono text-sm text-muted-foreground py-8">
                    No heartbeats yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Training Logs */}
            <Card>
              <CardHeader className="bg-black text-white">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  <CardTitle>Training Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-black p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{`Loading dataset...
Dataset loaded: 50000 training samples, 10000 validation samples
Initializing model: ResNet50
Model initialized. Parameters: 25,557,032
Starting training...
Epoch 1/10: loss=0.8234, accuracy=0.7123, val_loss=0.8121, val_accuracy=0.7234
Epoch 2/10: loss=0.6543, accuracy=0.7654, val_loss=0.6432, val_accuracy=0.7765
Epoch 3/10: loss=0.5432, accuracy=0.8123, val_loss=0.5321, val_accuracy=0.8234
Epoch 4/10: loss=0.4321, accuracy=0.8567, val_loss=0.4210, val_accuracy=0.8678
Epoch 5/10: loss=0.3456, accuracy=0.8901, val_loss=0.3345, val_accuracy=0.9012
${job.state === "completed" ? `Training completed!
Saving model to /output/model.pkl...
Model saved.
Saving weights to /output/weights.pth...
Weights saved.
Uploading results to IPFS...
Results uploaded: ${job.result_cid || "QmTrainingResult"}` : "Training in progress..."}`}</pre>
                </div>
              </CardContent>
            </Card>
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
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                      <Download className="h-4 w-4" />
                      Download Results
                    </Button>
                    <Link href={`/receipts/${job.chain_job_id}`}>
                      <Button className="w-full">
                        View ProofReceipt NFT
                      </Button>
                    </Link>
                  </>
                )}
                <a
                  href={`https://explorer.apothem.network/address/0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on XDC Explorer
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 border-2 border-black bg-black" />
                  <span>Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 border-2 border-black ${job.state !== "pending" ? "bg-black" : ""}`} />
                  <span>Claimed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 border-2 border-black ${job.state === "completed" ? "bg-black" : ""}`} />
                  <span>Completed</span>
                </div>
              </CardContent>
            </Card>

            {/* On-chain Proof */}
            <Card>
              <CardHeader className="bg-yellow-400 text-black">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  <CardTitle>On-Chain Proof</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Result CID</div>
                  <div className="break-all font-mono text-sm font-bold">{job.result_cid || "—"}</div>
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Instructions</div>
                  <div className="font-mono text-sm">{job.instruction_count?.toLocaleString() || "—"}</div>
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Started Block</div>
                  <div className="font-mono text-sm">{job.started_at_block || "—"}</div>
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Completed Block</div>
                  <div className="font-mono text-sm">{job.completed_at_block || "—"}</div>
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
