import ReceiptDetailClient from "./ReceiptDetailClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetailClient tokenId={params.id} />;
}
