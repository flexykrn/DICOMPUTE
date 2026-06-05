"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Job {
  chain_job_id: number;
  user_address: string;
  provider_address: string | null;
  state: string;
  docker_uri: string;
  deposit: string;
  created_at: string;
}

export default function ExplorerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = filter
    ? jobs.filter((j) => j.state === filter)
    : jobs;

  const getStatusColor = (state: string) => {
    switch (state) {
      case "pending": return "bg-yellow-500";
      case "active": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "slashed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">DICOMPUTE</div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Job Explorer</h1>

        <div className="flex gap-2 mb-6">
          <Button variant={filter === "" ? "default" : "outline"} onClick={() => setFilter("")}>
            All
          </Button>
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
            Pending
          </Button>
          <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>
            Active
          </Button>
          <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>
            Completed
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.chain_job_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold">Job #{job.chain_job_id}</div>
                    <div className="text-sm text-muted-foreground">
                      User: {job.user_address.slice(0, 6)}...{job.user_address.slice(-4)}
                    </div>
                    <div className="text-sm text-muted-foreground">{job.docker_uri}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(job.state)}>
                      {job.state}
                    </Badge>
                    <a href={`/jobs/${job.chain_job_id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
