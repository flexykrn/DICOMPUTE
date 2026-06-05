import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <nav className="border-b px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">DICOMPUTE</div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Verifiable GPU Compute on XDC
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Submit ML training jobs, get cryptographically signed proof-of-execution receipts as NFTs.
            No trust required — everything is verified on-chain.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/wizard">
              <Button size="lg" className="text-lg px-8">
                Submit Job
              </Button>
            </Link>
            <Link href="/explorer">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Explore Jobs
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Submit</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Configure your training job with Docker, CPU, RAM, and GPU specs.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Verify</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Watch real-time heartbeats cryptographically signed by the provider.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Prove</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Receive an NFT receipt proving your compute happened — grant-ready.
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Link href="/provider">
            <Button variant="secondary" size="lg">
              Become a Provider →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
