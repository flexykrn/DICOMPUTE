"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dicompute-backend.onrender.com";

export default function JobDetailClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/jobs/${jobId}`)
      .then(r => r.json())
      .then(setJob)
      .catch(console.error);
  }, [jobId]);

  if (!job) return <div className="p-8">Loading job {jobId}...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Job #{job.chain_job_id}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-100 rounded"><strong>State:</strong> {job.state}</div>
        <div className="p-4 bg-gray-100 rounded"><strong>Docker:</strong> {job.docker_uri}</div>
        <div className="p-4 bg-gray-100 rounded"><strong>CPU:</strong> {job.cpu_milli} milli</div>
        <div className="p-4 bg-gray-100 rounded"><strong>RAM:</strong> {job.ram_mib} MiB</div>
      </div>
    </div>
  );
}
