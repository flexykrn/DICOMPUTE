"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useReadContract } from "wagmi";
import { Loader2, ExternalLink, ShieldCheck, Download } from "lucide-react";
import { formatEther } from "viem";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const PROOF_RECEIPT_ADDRESS = "0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2";

// Minimal ProofReceipt ABI for frontend reads
const proofReceiptAbi = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getReceipt",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "jobId", type: "uint256" },
          { internalType: "address", name: "provider", type: "address" },
          { internalType: "string", name: "resultCID", type: "string" },
          { internalType: "uint256", name: "instructionCount", type: "uint256" },
          { internalType: "uint256", name: "cost", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ProofReceipt.Receipt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

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
  const numericTokenId = Number(tokenId);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: onChainReceipt } = useReadContract({
    address: PROOF_RECEIPT_ADDRESS,
    abi: proofReceiptAbi,
    functionName: "getReceipt",
    args: [BigInt(numericTokenId)],
    query: { enabled: numericTokenId > 0 },
  });

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`${API_URL}/api/receipts/${tokenId}`);
        if (res.ok) setReceipt(await res.json());
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
      <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-yellow-400 px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest text-black">
            <ShieldCheck className="h-4 w-4" />
            ProofReceipt NFT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
            Receipt #{tokenId}
          </h1>
          <p className="mt-2 font-mono text-muted-foreground">
            Cryptographic proof of compute execution stored on XDC Apothem.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden">
            <CardHeader className="bg-black text-white">
              <div className="flex items-center justify-between">
                <CardTitle>VERIFIED PROOF</CardTitle>
                <Badge variant="accent" className="text-xs">ERC-721</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {receipt ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border-2 border-black bg-[#f7f7f5] p-4">
                      <div className="mb-1 font-mono text-xs font-bold uppercase text-muted-foreground">Token ID</div>
                      <div className="text-2xl font-black">#{receipt.token_id}</div>
                    </div>

                    <div className="border-2 border-black bg-[#f7f7f5] p-4">
                      <div className="mb-1 font-mono text-xs font-bold uppercase text-muted-foreground">Job ID</div>
                      <div className="text-2xl font-black">#{receipt.job_id}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">User Address</div>
                      <div className="break-all font-mono text-sm">{receipt.user_address}</div>
                    </div>

                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Provider Address</div>
                      <div className="break-all font-mono text-sm">{receipt.provider_address}</div>
                    </div>

                    <div className="border-2 border-black bg-[#e5e5e5] p-4">
                      <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Result CID</div>
                      <div className="break-all font-mono text-sm font-bold">{receipt.result_cid}</div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Instruction Count</div>
                        <div className="font-mono text-lg font-bold">{receipt.instruction_count?.toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="font-mono text-xs font-bold uppercase text-muted-foreground">Cost</div>
                        <div className="font-mono text-lg font-bold">{receipt.cost ? `${formatEther(BigInt(receipt.cost))} XDC` : "—"}</div>
                      </div>
                    </div>

                    {onChainReceipt && (
                      <div className="border-t-2 border-dashed border-black pt-4">
                        <div className="mb-2 font-mono text-xs font-bold uppercase text-muted-foreground">
                          On-Chain Verification
                        </div>
                        <div className="grid gap-2 font-mono text-xs">
                          <div className="flex justify-between">
                            <span>Contract</span>
                            <span className="break-all text-right">{PROOF_RECEIPT_ADDRESS}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>On-chain CID</span>
                            <span className="break-all text-right font-bold">{onChainReceipt.resultCID}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>On-chain cost</span>
                            <span className="text-right font-bold">{formatEther(onChainReceipt.cost)} XDC</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Minted at</span>
                            <span className="text-right">{new Date(Number(onChainReceipt.timestamp) * 1000).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <a
                      href={`https://explorer.apothem.network/address/${PROOF_RECEIPT_ADDRESS}?a=${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full gap-2">
                        Verify on XDC Explorer
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>

                    {receipt.result_cid && (
                      <a
                        href={`${API_URL}/api/ipfs/download/${receipt.result_cid}`}
                        download
                        className="w-full"
                      >
                        <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                          <Download className="h-4 w-4" />
                          Download Results
                        </Button>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center font-mono text-muted-foreground">
                  Receipt not found in backend. If the job was just completed, wait for the indexer.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
