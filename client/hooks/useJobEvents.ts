"use client";

import { useEffect, useState } from "react";
import { useWatchContractEvent, useAccount } from "wagmi";
import { jobEscrowAbi, JOB_ESCROW_ADDRESS } from "@/lib/contracts/JobEscrow";

export interface JobCompletedEvent {
  jobId: bigint;
  provider: string;
  payout: bigint;
}

export function useJobCompletedListener() {
  const { address } = useAccount();
  const [events, setEvents] = useState<JobCompletedEvent[]>([]);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: jobEscrowAbi,
    eventName: "JobCompleted",
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        
        const event: JobCompletedEvent = {
          jobId: args.jobId,
          provider: args.provider,
          payout: args.payout,
        };
        
        setEvents((prev) => [...prev, event]);
        
        // Optional: show toast notification
        if (typeof window !== "undefined") {
          console.log(`Job #${event.jobId.toString()} completed! Provider: ${event.provider}`);
        }
      }
    },
  });

  return { events, clearEvents: () => setEvents([]) };
}

export function useJobClaimedListener() {
  const [claimedJobs, setClaimedJobs] = useState<{ jobId: bigint; provider: string }[]>([]);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: jobEscrowAbi,
    eventName: "JobClaimed",
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        
        setClaimedJobs((prev) => [...prev, { jobId: args.jobId, provider: args.provider }]);
      }
    },
  });

  return { claimedJobs };
}
