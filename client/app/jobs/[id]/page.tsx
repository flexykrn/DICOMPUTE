import JobDetailClient from "./JobDetailClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return <JobDetailClient />;
}
