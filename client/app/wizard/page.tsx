"use client";

import { useState, useEffect } from "react";
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
import { Zap } from "lucide-react";
import Link from "next/link";

export default function WizardPage() {
  const { isConnected, address } = useAccount();
  const [dockerUri, setDockerUri] = useState("");
  const [cpu, setCpu] = useState([1000]);
  const [ram, setRam] = useState([1024]);
  const [vram, setVram] = useState([0]);
  const [duration, setDuration] = useState([10]);
  const [price, setPrice] = useState(["1000000000000000"]);

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
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
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
          <Button variant="outline" onClick={fillDemo}>
            Fill Demo Data
          </Button>
        </div>

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
                  <div className="border-2 border-black bg-[#e5e5e5] p-3 font-mono text-xs break-all">
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
                  <div className="border-2 border-black bg-yellow-400 p-3 font-mono text-xs font-bold text-black">
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
