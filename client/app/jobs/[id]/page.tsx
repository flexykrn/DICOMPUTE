"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  state: string;
  deposit: string;
  result_cid: string | null;
  instruction_count: number | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

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

    fetchJob();
  }, [jobId]);

  useEffect(() => {
    const fetchHeartbeats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}/heartbeats`);
        if (res.ok) {
          const data = await res.json();
          setHeartbeats(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchHeartbeats();
    const interval = setInterval(fetchHeartbeats, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case "pending": return "bg-yellow-500";
      case "active": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "slashed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading job...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">DICOMPUTE</div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Job #{jobId}</h1>
          <Badge className={getStatusColor(job.state)}>
            {job.state.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><span className="text-muted-foreground">User:</span> {job.user_address}</div>
              <div><span className="text-muted-foreground">Provider:</span> {job.provider_address || "Not assigned"}</div>
              <div><span className="text-muted-foreground">Docker:</span> {job.docker_uri}</div>
              <div><span className="text-muted-foreground">CPU:</span> {job.cpu_milli} milli</div>
              <div><span className="text-muted-foreground">RAM:</span> {job.ram_mib} MiB</div>
              <div><span className="text-muted-foreground">VRAM:</span> {job.vram_mib} MiB</div>
              <div><span className="text-muted-foreground">Deposit:</span> {job.deposit} wei</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {job.state === "completed" && job.result_cid && (
                <div className="space-y-4">
                  <div>
                    <span className="text-muted-foreground">Result CID:</span>{" "}
                    <code className="text-sm">{job.result_cid}</code>
                  </div>
                  <Link href={`/receipts/${jobId}`}>
                    <Button className="w-full">View Receipt NFT</Button>
                  </Link>
                </div>
              )}
              {job.state === "active" && (
                <div className="text-blue-500 animate-pulse">
                  Job is running — heartbeats incoming...
                </div>
              )}
              {job.state === "pending" && (
                <div className="text-yellow-500">
                  Waiting for provider to claim...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {heartbeats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Heartbeats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={heartbeats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="block_number" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu_percent" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="ram_percent" stroke="#82ca9d" name="RAM %" />
                    <Line type="monotone" dataKey="vram_percent" stroke="#ffc658" name="VRAM %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
