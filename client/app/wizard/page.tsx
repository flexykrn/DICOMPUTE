"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { JOB_ESCROW_ADDRESS, jobEscrowAbi } from "@/lib/contracts/JobEscrow";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Zap, ArrowLeft, Cpu, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function WizardContent() {
  const { isConnected, address } = useAccount();
  const searchParams = useSearchParams();

  const selectedProvider = searchParams.get("provider");
  const selectedGPU = searchParams.get("gpu");
  const selectedPrice = searchParams.get("price");
  const selectedVram = searchParams.get("vram");
  const selectedCuda = searchParams.get("cuda");

  const [dockerUri, setDockerUri] = useState("");
  const [cpu, setCpu] = useState([1000]);
  const [ram, setRam] = useState([1024]);
  const [vram, setVram] = useState([0]);
  const [duration, setDuration] = useState([10]);
  const [price, setPrice] = useState(["1000000000000000"]);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetCid, setDatasetCid] = useState<string | null>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  const {
    writeContract,
    isPending: isSubmitting,
    data: hash,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      toast.success(`Job submitted. Tx: ${hash?.slice(0, 20)}...`);
      reset();
    }
  }, [isConfirmed, hash, reset]);

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || "Transaction failed");
    }
  }, [writeError]);

  const fillDemo = () => {
    setDockerUri("docker.io/library/hello-world:latest");
    setCpu([1000]);
    setRam([1024]);
    setVram([0]);
    setDuration([10]);
    setPrice(["1000000000000000"]);
    toast.success("Demo data filled");
  };

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDatasetFile(file);
    setUploadingDataset(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/ipfs/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDatasetCid(data.cid);
        toast.success(`Dataset uploaded: ${data.cid.slice(0, 20)}...`);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("Upload error");
      console.error(err);
    } finally {
      setUploadingDataset(false);
    }
  };

  const estimatedCost = (BigInt(duration[0]) * BigInt(price[0])).toString();
  const estimatedCostXdc = (Number(estimatedCost) / 1e18).toFixed(6);

  const handleSubmit = () => {
    if (!isConnected) {
      toast.info("Connect wallet first");
      return;
    }
    if (!dockerUri.trim()) {
      toast.error("Docker image URI is required");
      return;
    }

    const deposit = BigInt(estimatedCost);
    if (deposit <= 0n) {
      toast.error("Deposit must be greater than 0");
      return;
    }

    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: jobEscrowAbi,
      functionName: "submitJob",
      args: [
        {
          dockerUri,
          cpuMilli: BigInt(cpu[0]),
          ramMiB: BigInt(ram[0]),
          vramMiB: BigInt(vram[0]),
          durationBlocks: BigInt(duration[0]),
          maxPricePerBlock: BigInt(price[0]),
        },
        deposit,
      ],
      value: deposit,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step 1 of 3
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
              Submit Job
            </h1>
            <p className="mt-2 max-w-xl font-mono text-sm text-muted-foreground">
              Define your Docker workload and lock a deposit in the escrow contract.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to GPUs
              </Button>
            </Link>
            <Button variant="outline" onClick={fillDemo}>
              Fill Demo Data
            </Button>
          </div>
        </div>

        {/* Selected GPU Card */}
        {selectedGPU && (
          <Card className="mb-6 border-2 border-[var(--accent)] bg-[var(--bg-secondary)]">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-on-card)]">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-[var(--text-secondary)]">
                    Selected GPU
                  </div>
                  <div className="text-xl font-black">{decodeURIComponent(selectedGPU)}</div>
                  <div className="font-mono text-xs text-[var(--text-secondary)]">
                    Provider: {selectedProvider?.slice(0, 8)}...{selectedProvider?.slice(-6)} • {selectedVram}GB VRAM • {selectedCuda} CUDA cores
                  </div>
                </div>
              </div>
                <div className="text-right text-[var(--text-primary)]">
                <div className="font-mono text-xs text-[var(--text-secondary)]">PRICE</div>
                <div className="text-2xl font-black text-[var(--accent)]">
                  ${selectedPrice}/hr
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Specification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                    Docker Image URI
                  </Label>
                  <Input
                    placeholder="docker.io/library/hello-world:latest"
                    value={dockerUri}
                    onChange={(e) => setDockerUri(e.target.value)}
                  />
                  <p className="font-mono text-xs text-muted-foreground">
                    The provider will pull and run this image.
                  </p>
                </div>

                {/* Dataset Upload */}
                <div className="space-y-2">
                  <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                    Dataset / Training Script (Optional)
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={handleDatasetUpload}
                      className="hidden"
                      id="dataset-upload"
                      accept=".py,.zip,.tar,.tar.gz,.json,.csv"
                    />
                    <label
                      htmlFor="dataset-upload"
                      className="flex-1 cursor-pointer border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 font-mono text-sm transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      {datasetFile ? (
                        <span className="font-bold">{datasetFile.name}</span>
                      ) : uploadingDataset ? (
                        <span className="text-muted-foreground">Uploading to IPFS...</span>
                      ) : (
                        <span className="text-muted-foreground">Click to upload .py, .zip, .tar, .json, .csv</span>
                      )}
                    </label>
                  </div>
                  {datasetCid && (
                    <div className="border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 font-mono text-xs break-all text-[var(--text-primary)]">
                      IPFS CID: {datasetCid}
                    </div>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">
                    Uploaded files are stored on IPFS and mounted into the container at /dataset.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                      CPU: {cpu[0]} milli
                    </Label>
                    <Slider value={cpu} onValueChange={setCpu} min={100} max={16000} step={100} />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                      RAM: {ram[0]} MiB
                    </Label>
                    <Slider value={ram} onValueChange={setRam} min={512} max={65536} step={512} />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                      VRAM: {vram[0]} MiB
                    </Label>
                    <Slider value={vram} onValueChange={setVram} min={0} max={49152} step={1024} />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                      Duration: {duration[0]} blocks
                    </Label>
                    <Slider value={duration} onValueChange={setDuration} min={1} max={10000} step={1} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs font-bold uppercase tracking-wider">
                    Max Price Per Block (wei)
                  </Label>
                  <Input
                    value={price[0]}
                    onChange={(e) => setPrice([e.target.value])}
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isConfirming}
                >
                  <Zap className="h-5 w-5" />
                  {isSubmitting
                    ? "Waiting for wallet..."
                    : isConfirming
                    ? "Confirming..."
                    : "Submit Job on-chain"}
                </Button>

                {hash && (
                  <div className="border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 font-mono text-xs break-all text-[var(--text-primary)]">
                    TX HASH: {hash}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between border-b-2 border-dashed border-black pb-2">
                  <span className="font-mono text-sm">Duration × Price</span>
                  <span className="font-mono text-sm">{duration[0]} × {price[0]}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-xs font-bold uppercase">Total Deposit</span>
                  <span className="font-mono text-lg font-bold">{estimatedCost} wei</span>
                </div>
                <div className="flex items-end justify-between text-muted-foreground">
                  <span className="font-mono text-xs">≈ XDC</span>
                  <span className="font-mono text-sm">{estimatedCostXdc} XDC</span>
                </div>

                {!isConnected && (
                  <div className="border-2 border-[var(--accent)] bg-[var(--accent)] p-3 font-mono text-xs font-bold text-[var(--text-primary)]">
                    Connect your wallet to submit.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Badge variant="accent">1</Badge>
                  <span>Submit the job to JobEscrow.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="accent">2</Badge>
                  <span>Provider claims and executes the container.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="accent">3</Badge>
                  <span>Track progress in the Explorer.</span>
                </div>
                <Link href="/explorer">
                  <Button variant="outline" className="mt-2 w-full">
                    Go to Explorer
                  </Button>
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

export default function WizardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Navigation />
        <main className="flex flex-1 items-center justify-center font-mono">Loading wizard...</main>
        <Footer />
      </div>
    }>
      <WizardContent />
    </Suspense>
  );
}
