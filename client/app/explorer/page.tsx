"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface Job {
  chain_job_id: number;
  user_address: string;
  provider_address: string | null;
  state: string;
  docker_uri: string;
  deposit: string;
  result_cid: string | null;
  instruction_count: number | null;
  created_at: string;
}

interface Stats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  slashed_jobs: number;
}

const filters = [
  { key: "", label: "ALL" },
  { key: "pending", label: "PENDING" },
  { key: "active", label: "ACTIVE" },
  { key: "completed", label: "COMPLETED" },
  { key: "slashed", label: "SLASHED" },
];

function getStatusVariant(state: string) {
  switch (state) {
    case "pending": return "secondary";
    case "active": return "accent";
    case "completed": return "default";
    case "slashed": return "destructive";
    default: return "outline";
  }
}

export default function ExplorerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/jobs`),
          fetch(`${API_URL}/api/stats`),
        ]);
        if (jobsRes.ok) setJobs(await jobsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = filter ? jobs.filter((j) => j.state === filter) : jobs;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
              Job Explorer
            </h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              Real-time view of all on-chain compute jobs.
            </p>
          </div>
          <Link href="/wizard">
            <Button>Submit New Job</Button>
          </Link>
        </div>

        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "TOTAL", value: stats.total_jobs },
              { label: "PENDING", value: stats.active_jobs + stats.slashed_jobs + stats.completed_jobs === 0 ? 0 : stats.total_jobs - (stats.active_jobs + stats.completed_jobs + stats.slashed_jobs) },
              { label: "ACTIVE", value: stats.active_jobs },
              { label: "COMPLETED", value: stats.completed_jobs },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="text-4xl font-black">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading && jobs.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-20 font-mono text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading jobs...
          </div>
        )}

        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.chain_job_id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        #{job.chain_job_id}
                      </span>
                      <Badge variant={getStatusVariant(job.state)}>
                        {job.state}
                      </Badge>
                    </div>
                    <div className="mb-1 font-mono text-sm font-bold">
                      {job.docker_uri}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      USER: {job.user_address.slice(0, 8)}...{job.user_address.slice(-6)}
                    </div>
                    {job.provider_address && (
                      <div className="font-mono text-xs text-muted-foreground">
                        PROVIDER: {job.provider_address.slice(0, 8)}...{job.provider_address.slice(-6)}
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-col justify-between gap-3 border-black p-4 md:w-80 md:border-l-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-bold">{(Number(job.deposit) / 1e18).toFixed(6)} XDC</span>
                    </div>
                    {job.result_cid && (
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">Result: </span>
                        <span className="break-all font-bold">{job.result_cid}</span>
                      </div>
                    )}
                    <Link href={`/jobs/${job.chain_job_id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && filteredJobs.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center font-mono text-muted-foreground">
                <Search className="mx-auto mb-4 h-8 w-8" />
                No jobs found.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
