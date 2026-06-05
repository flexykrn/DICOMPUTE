"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

export default function WizardPage() {
  const [dockerUri, setDockerUri] = useState("");
  const [cpu, setCpu] = useState([4000]);
  const [ram, setRam] = useState([16384]);
  const [vram, setVram] = useState([8192]);
  const [duration, setDuration] = useState([180]);
  const [price, setPrice] = useState(["1000000000000000"]);

  const fillDemo = () => {
    setDockerUri("docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime");
    setCpu([4000]);
    setRam([16384]);
    setVram([8192]);
    setDuration([180]);
    setPrice(["1000000000000000"]);
    toast.success("Demo data filled!");
  };

  const estimatedCost = (parseInt(duration[0]) * parseInt(price[0])).toString();

  const handleSubmit = () => {
    toast.info("Submit job — connect wallet first!");
    // TODO: Implement Wagmi submitJob call
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
                placeholder="docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime"
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

            <Button className="w-full" size="lg" onClick={handleSubmit}>
              Submit Job (MetaMask)
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
