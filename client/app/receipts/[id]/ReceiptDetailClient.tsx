"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Shield, CheckCircle, ExternalLink, Download, Award, Cpu, Zap } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function ReceiptDetailClient({ tokenId }: { tokenId: string }) {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/receipts/${tokenId}`)
      .then(r => {
        if (!r.ok) throw new Error("Receipt not found");
        return r.json();
      })
      .then(data => {
        setReceipt(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [tokenId]);

  if (loading) return <div className="p-8">Loading receipt {tokenId}...</div>;
  
  if (!receipt) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-black mb-2">Receipt #{tokenId}</h1>
            <p className="font-mono text-muted-foreground">This receipt doesn't exist yet.</p>
            <p className="font-mono text-xs text-muted-foreground mt-2">Receipts are minted when jobs complete.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          {/* NFT Card */}
          <Card className="border-4 border-black overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white p-6 text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider mb-4">
                <Award className="h-4 w-4" />
                Verified Compute
              </div>
              <h1 className="text-3xl font-black">ProofReceipt #{receipt.token_id}</h1>
              <p className="font-mono text-sm text-gray-400 mt-2">ERC-721 NFT on XDC Apothem</p>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Verification Badge */}
              <div className="flex items-center justify-center gap-2 text-green-600 font-mono text-sm font-bold">
                <CheckCircle className="h-5 w-5" />
                Cryptographically Verified
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-black p-4">
                  <div className="font-mono text-xs text-muted-foreground mb-1">JOB ID</div>
                  <div className="font-mono text-lg font-bold">#{receipt.job_id}</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="font-mono text-xs text-muted-foreground mb-1">AMOUNT PAID</div>
                  <div className="font-mono text-lg font-bold">{receipt.amount_paid} XDC</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="font-mono text-xs text-muted-foreground mb-1">PROVIDER</div>
                  <div className="break-all font-mono text-sm font-bold">{receipt.provider_address?.slice(0, 12)}...</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="font-mono text-xs text-muted-foreground mb-1">RESULT CID</div>
                  <div className="break-all font-mono text-sm font-bold">{receipt.result_cid?.slice(0, 20)}...</div>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-2 border-black p-4 bg-gray-50">
                <div className="font-mono text-xs font-bold uppercase tracking-wider mb-3">Proof Metadata</div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-bold">0x2Ff9...1a075</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-bold">XDC Apothem (Chain ID: 51)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard</span>
                    <span className="font-bold">ERC-721</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minted At</span>
                    <span className="font-bold">{new Date(receipt.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download Result
                </Button>
                <a 
                  href={`https://explorer.apothem.network/txs/${receipt.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View on Explorer
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* What this means */}
          <div className="mt-8 border-2 border-black p-6">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-4">What This Proves</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <div className="font-mono text-xs font-bold">Auditability</div>
                <div className="font-mono text-xs text-muted-foreground">Anyone can verify</div>
              </div>
              <div className="text-center">
                <Cpu className="h-8 w-8 mx-auto mb-2" />
                <div className="font-mono text-xs font-bold">Reproducibility</div>
                <div className="font-mono text-xs text-muted-foreground">Pin exact Docker image</div>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-2" />
                <div className="font-mono text-xs font-bold">Citable</div>
                <div className="font-mono text-xs text-muted-foreground">Use in research papers</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
