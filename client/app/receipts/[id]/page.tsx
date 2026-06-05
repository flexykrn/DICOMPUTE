"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ReceiptData {
  token_id: number;
  job_id: number;
  user_address: string;
  provider_address: string;
  result_cid: string;
  instruction_count: number;
  cost: string;
  minted_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const tokenId = params.id as string;

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`${API_URL}/api/receipts/${tokenId}`);
        if (res.ok) {
          const data = await res.json();
          setReceipt(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading receipt...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Receipt not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">DICOMPUTE</div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ProofReceipt NFT</h1>
          <p className="text-muted-foreground">Verifiable proof of compute execution</p>
        </div>

        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Receipt #{receipt.token_id}</CardTitle>
              <Badge className="bg-green-500">VERIFIED</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Job ID</div>
                <div className="font-mono">#{receipt.job_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cost</div>
                <div className="font-mono">{receipt.cost} wei</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">User</div>
              <div className="font-mono text-sm">{receipt.user_address}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Provider</div>
              <div className="font-mono text-sm">{receipt.provider_address}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Result CID</div>
              <code className="text-sm break-all">{receipt.result_cid}</code>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Instructions</div>
              <div>{receipt.instruction_count?.toLocaleString()}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Minted</div>
              <div>{new Date(receipt.minted_at).toLocaleString()}</div>
            </div>

            <div className="pt-4 space-y-2">
              <a
                href={`https://explorer.apothem.network/tx/${receipt.token_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Verify on XDC Explorer
                </Button>
              </a>
              <Button className="w-full">
                Download Audit JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
