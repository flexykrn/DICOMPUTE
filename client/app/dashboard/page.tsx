"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Activity, Cpu, FileCheck, Zap, TrendingUp, Clock, Users } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface Stats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  slashed_jobs: number;
  total_providers: number;
  active_providers: number;
  total_receipts: number;
}

interface Job {
  chain_job_id: number;
  user_address: string;
  provider_address: string | null;
  state: string;
  docker_uri: string;
  deposit: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          fetch(`${API_URL}/api/stats`),
          fetch(`${API_URL}/api/jobs?limit=10`),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (jobsRes.ok) {
          const jobs = await jobsRes.json();
          setRecentJobs(jobs.slice(0, 5));
        }
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

  const statCards = stats ? [
    { label: "Total Jobs", value: stats.total_jobs, icon: FileCheck, color: "bg-blue-500" },
    { label: "Active Jobs", value: stats.active_jobs, icon: Zap, color: "bg-yellow-500" },
    { label: "Completed", value: stats.completed_jobs, icon: FileCheck, color: "bg-green-500" },
    { label: "Providers", value: stats.total_providers, icon: Users, color: "bg-purple-500" },
    { label: "Active Providers", value: stats.active_providers, icon: Cpu, color: "bg-orange-500" },
    { label: "Receipts", value: stats.total_receipts, icon: FileCheck, color: "bg-pink-500" },
  ] : [];

  function getStatusVariant(state: string) {
    switch (state) {
      case "pending": return "secondary";
      case "active": return "accent";
      case "completed": return "default";
      case "slashed": return "destructive";
      default: return "outline";
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
            Network Dashboard
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Real-time overview of the DICOMPUTE network.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {loading && !stats
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center ${s.color} text-white`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-3xl font-black">{s.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link href="/explorer" className="font-mono text-xs font-bold text-blue-600 hover:underline">
                  View All →
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentJobs.length === 0 && !loading && (
                    <div className="py-8 text-center font-mono text-sm text-muted-foreground">
                      No recent activity.
                    </div>
                  )}
                  {recentJobs.map((job) => (
                    <div
                      key={job.chain_job_id}
                      className="flex items-center justify-between border-b border-black/10 pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-black text-white font-mono text-xs font-bold">
                          #{job.chain_job_id}
                        </div>
                        <div>
                          <div className="font-mono text-sm font-bold">{job.docker_uri}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {job.user_address.slice(0, 8)}...{job.user_address.slice(-6)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusVariant(job.state)}>{job.state}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Health */}
          <div className="space-y-6">
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle>Network Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Blockchain</span>
                  <Badge variant="default" className="font-mono">XDC Apothem</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="font-mono text-sm font-bold">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Avg Job Time</span>
                  <span className="font-mono text-sm font-bold">~2 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Success Rate</span>
                  <span className="font-mono text-sm font-bold">
                    {stats && stats.total_jobs > 0
                      ? `${((stats.completed_jobs / stats.total_jobs) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
                <div className="border-t-2 border-black pt-4">
                  <div className="font-mono text-xs text-muted-foreground mb-2">Network TPS</div>
                  <div className="flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-black"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-400">
              <CardHeader className="bg-yellow-400 text-black">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <Link href="/wizard">
                  <div className="flex items-center justify-between border-2 border-black p-3 font-mono text-sm font-bold hover:bg-black hover:text-white transition-colors cursor-pointer">
                    <span>Submit Job</span>
                    <Zap className="h-4 w-4" />
                  </div>
                </Link>
                <Link href="/provider">
                  <div className="flex items-center justify-between border-2 border-black p-3 font-mono text-sm font-bold hover:bg-black hover:text-white transition-colors cursor-pointer">
                    <span>Register GPU</span>
                    <Cpu className="h-4 w-4" />
                  </div>
                </Link>
                <Link href="/explorer">
                  <div className="flex items-center justify-between border-2 border-black p-3 font-mono text-sm font-bold hover:bg-black hover:text-white transition-colors cursor-pointer">
                    <span>Explore Jobs</span>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
