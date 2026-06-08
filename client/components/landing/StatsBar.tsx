"use client";

import { useEffect, useState } from "react";
import { Activity, Cpu, Clock, Shield } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dicompute-backend.onrender.com";

export function StatsBar() {
  const [stats, setStats] = useState({
    total_jobs: 1247,
    active_providers: 89,
    avg_block_time: "2s",
    uptime: "99.7%",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats((prev) => ({
            ...prev,
            total_jobs: data.total_jobs || prev.total_jobs,
            active_providers: data.active_providers || prev.active_providers,
          }));
        }
      } catch {
        // keep mock numbers
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { label: "TOTAL JOBS", value: stats.total_jobs.toLocaleString(), icon: Activity },
    { label: "ACTIVE PROVIDERS", value: stats.active_providers.toString(), icon: Cpu },
    { label: "AVG BLOCK TIME", value: stats.avg_block_time, icon: Clock },
    { label: "UPTIME", value: stats.uptime, icon: Shield },
  ];

  return (
    <section className="border-b-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-0 divide-x-2 divide-[var(--border-color)] md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-3 py-4 md:py-5">
              <item.icon className="h-5 w-5 text-[var(--accent)]" />
              <div className="text-center">
                <div className="font-mono text-lg font-black text-[var(--text-primary)]">{item.value}</div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
