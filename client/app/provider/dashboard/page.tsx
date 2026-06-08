"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAccount } from "wagmi";
import { Cpu, Zap, Wallet, TrendingUp, Award, Activity, Clock, DollarSign, BarChart3, Star } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface ProviderStats {
  total_jobs_completed: number;
  total_jobs_failed: number;
  total_earnings: string;
  reputation_score: number;
  uptime_percent: number;
  avg_job_time: number;
}

export default function ProviderDashboardPage() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<ProviderStats>({
    total_jobs_completed: 12,
    total_jobs_failed: 1,
    total_earnings: "450.5",
    reputation_score: 4.8,
    uptime_percent: 99.2,
    avg_job_time: 8.5,
  });

  const earningsHistory = [
    { date: "Jun 8", amount: 45.2, jobs: 2 },
    { date: "Jun 7", amount: 89.5, jobs: 3 },
    { date: "Jun 6", amount: 120.0, jobs: 4 },
    { date: "Jun 5", amount: 65.8, jobs: 2 },
    { date: "Jun 4", amount: 130.0, jobs: 5 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Provider Dashboard
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Track earnings, reputation, and job history.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">TOTAL EARNED</p>
                  <p className="text-3xl font-black">{stats.total_earnings} <span className="text-sm font-normal">XDC</span></p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">JOBS COMPLETED</p>
                  <p className="text-3xl font-black">{stats.total_jobs_completed}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">REPUTATION</p>
                  <p className="text-3xl font-black">{stats.reputation_score}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">UPTIME</p>
                  <p className="text-3xl font-black">{stats.uptime_percent}%</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Earnings History */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earningsHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-black/10 pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-black text-white flex items-center justify-center font-mono text-xs font-bold">
                        {entry.date.split(" ")[1]}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold">{entry.date}</div>
                        <div className="font-mono text-xs text-muted-foreground">{entry.jobs} jobs</div>
                      </div>
                    </div>
                    <div className="font-mono text-lg font-bold text-green-600">+{entry.amount} XDC</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span>Success Rate</span>
                  <span className="font-bold">92%</span>
                </div>
                <div className="h-2 w-full bg-gray-200">
                  <div className="h-full bg-green-500" style={{ width: "92%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span>Response Time</span>
                  <span className="font-bold">{stats.avg_job_time}s avg</span>
                </div>
                <div className="h-2 w-full bg-gray-200">
                  <div className="h-full bg-blue-500" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span>Stake Health</span>
                  <span className="font-bold">0.1 / 0.1 XDC</span>
                </div>
                <div className="h-2 w-full bg-gray-200">
                  <div className="h-full bg-yellow-500" style={{ width: "100%" }} />
                </div>
              </div>

              <div className="mt-4 border-t-2 border-black pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="font-mono text-xs text-muted-foreground">RANK</div>
                    <div className="text-2xl font-black">#3</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-muted-foreground">TIER</div>
                    <div className="text-2xl font-black">Gold</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
