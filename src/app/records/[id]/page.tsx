import { Suspense } from "react";
import RecordDetailsClient from "./record-details-client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ datasetId?: string }>;
};

function RecordDetailsLoading() {
  return (
    <main className="min-h-screen bg-[#F5F4EF] px-5 pb-12 pt-24 sm:px-7 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1500px] animate-pulse">
        <div className="mb-8 border-b border-[#E3E6DE] pb-6">
          <div className="h-3 w-36 rounded bg-[#E2E7DF]" />
          <div className="mt-5 h-9 w-56 rounded bg-[#E2E7DF]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#E9ECE6]" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-72 rounded-2xl border border-[#E5E8E1] bg-white" />
          <div className="h-72 rounded-2xl border border-[#E5E8E1] bg-white" />
        </div>
      </div>
    </main>
  );
}

async function RecordDetailsContent({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <RecordDetailsClient recordId={id} datasetId={query.datasetId ?? ""} />;
}

export default function RecordDetailsPage(props: PageProps) {
  return (
    <Suspense fallback={<RecordDetailsLoading />}>
      <RecordDetailsContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
