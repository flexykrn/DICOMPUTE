"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { JOB_ESCROW_ADDRESS, jobEscrowAbi } from "@/lib/contracts/JobEscrow";

export default function WizardPage() {
  const { isConnected } = useAccount();
  const [dockerUri, setDockerUri] = useState("");
  const [cpu, setCpu] = useState([4000]);
  const [ram, setRam] = useState([16384]);
  const [vram, setVram] = useState([8192]);
  const [duration, setDuration] = useState([180]);
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
      toast.success(`Job submitted! Tx: ${hash}`);
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
    toast.success("Demo data filled!");
  };

  const estimatedCost = (BigInt(duration[0]) * BigInt(price[0])).toString();

  const handleSubmit = () => {
    if (!isConnected) {
      toast.info("Connect wallet first!");
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
        [
          dockerUri,
          BigInt(cpu[0]),
          BigInt(ram[0]),
          BigInt(vram[0]),
          BigInt(duration[0]),
          BigInt(price[0]),
        ],
        deposit,
      ],
      value: deposit,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">DICOMPUTE</div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Submit Job</h1>
          <Button variant="outline" onClick={fillDemo}>
            Fill Demo Data
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Docker Image URI</Label>
              <Input
                placeholder="docker.io/library/hello-world:latest"
                value={dockerUri}
                onChange={(e) => setDockerUri(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>CPU (milli-units): {cpu[0]}</Label>
              <Slider value={cpu} onValueChange={setCpu} min={100} max={16000} step={100} />
            </div>

            <div className="space-y-2">
              <Label>RAM (MiB): {ram[0]}</Label>
              <Slider value={ram} onValueChange={setRam} min={512} max={65536} step={512} />
            </div>

            <div className="space-y-2">
              <Label>VRAM (MiB): {vram[0]}</Label>
              <Slider value={vram} onValueChange={setVram} min={0} max={49152} step={1024} />
            </div>

            <div className="space-y-2">
              <Label>Duration (blocks): {duration[0]}</Label>
              <Slider value={duration} onValueChange={setDuration} min={1} max={10000} step={1} />
            </div>

            <div className="space-y-2">
              <Label>Max Price Per Block (wei)</Label>
              <Input
                value={price[0]}
                onChange={(e) => setPrice([e.target.value])}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Estimated Cost</div>
              <div className="text-2xl font-bold">{estimatedCost} wei</div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || isConfirming}
            >
              {isSubmitting
                ? "Waiting for wallet..."
                : isConfirming
                ? "Confirming..."
                : "Submit Job (MetaMask)"}
            </Button>

            {hash && (
              <div className="text-sm text-muted-foreground break-all">
                Tx: {hash}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
