"use client";

import { useEffect, useState, useCallback } from "react";
import { useReadContract } from "wagmi";
import { jobEscrowAbi, JOB_ESCROW_ADDRESS } from "@/lib/contracts/JobEscrow";

export type JobState = "Pending" | "Active" | "Completed" | "Cancelled" | "Unknown";

const stateMap: Record<number, JobState> = {
  0: "Pending",
  1: "Active",
  2: "Completed",
  3: "Cancelled",
};

export interface JobData {
  id: bigint;
  user: string;
  dockerUri: string;
  cpuMilli: bigint;
  ramMiB: bigint;
  vramMiB: bigint;
  deposit: bigint;
  state: JobState;
  provider: string;
  startedAt: bigint;
  completedAt: bigint;
  resultCID: string;
  instructionCount: bigint;
}

export function useJobStatus(jobId: bigint | null) {
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isError, isLoading: contractLoading, refetch } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: jobEscrowAbi,
    functionName: "getJob",
    args: jobId !== null ? [jobId] : undefined,
    query: {
      enabled: jobId !== null,
    },
  });

  useEffect(() => {
    if (data) {
      const raw = data as any;
      setJob({
        id: raw[0],
        user: raw[1],
        dockerUri: raw[2]?.dockerUri ?? "",
        cpuMilli: raw[2]?.cpuMilli ?? 0n,
        ramMiB: raw[2]?.ramMiB ?? 0n,
        vramMiB: raw[2]?.vramMiB ?? 0n,
        deposit: raw[3],
        state: stateMap[Number(raw[4])] ?? "Unknown",
        provider: raw[5],
        startedAt: raw[6],
        completedAt: raw[7],
        resultCID: raw[9],
        instructionCount: raw[10],
      });
      setError(null);
    }
    if (isError) {
      setError("Failed to fetch job status");
    }
    setIsLoading(contractLoading);
  }, [data, isError, contractLoading]);

  // Auto-poll every 5 seconds
  useEffect(() => {
    if (jobId === null) return;
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId, refetch]);

  return { job, isLoading, error, refetch };
}

export function useJobCount() {
  const { data, isLoading, refetch } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: jobEscrowAbi,
    functionName: "getJobCount",
  });

  return { count: data ? Number(data) : 0, isLoading, refetch };
}
