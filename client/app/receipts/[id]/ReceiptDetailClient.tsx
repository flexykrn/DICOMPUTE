"use client";

import { useEffect, useState } from "react";

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
  if (!receipt) return <div className="p-8">Receipt #{tokenId} not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Receipt NFT #{receipt.token_id}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-100 rounded"><strong>Job ID:</strong> {receipt.job_id}</div>
        <div className="p-4 bg-gray-100 rounded"><strong>Amount:</strong> {receipt.amount_paid}</div>
      </div>
    </div>
  );
}
