"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Copy,
  Database, FileJson2, Fingerprint, History, Link2, Loader2, RefreshCw,
  Search, ShieldCheck, XCircle,
} from "lucide-react";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthInitialized,
  setAuthLoading,
  setAuthUser,
} from "@/store/slices/authSlice";

type RelatedRecord = {
  id: string;
  externalId: string;
  data: Record<string, unknown>;
  createdAt: string;
};
type RecordPayload = {
  id: string;
  datasetId: string;
  externalId: string;
  datasetName: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  relatedRecords: RelatedRecord[];
  history: unknown[];
  historyAvailable: boolean;
};

const prettyLabel = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};
const dateTime = (value: string) => new Intl.DateTimeFormat("en", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

export default function RecordDetailsClient({ recordId, datasetId }: { recordId: string; datasetId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    isAuthenticated,
    isInitialized,
    isLoading: authLoading,
    user: currentUser,
  } = useAppSelector((state) => state.auth);
  const [record, setRecord] = useState<RecordPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!datasetId) {
      setError("Dataset ID is missing. Open this record from a dataset so its access can be verified.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/records/${recordId}?datasetId=${encodeURIComponent(datasetId)}`, { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        router.replace("/login");
        throw new Error(result.message || "Your session has expired. Please sign in again.");
      }
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to load record.");
      setRecord(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [datasetId, recordId, dispatch, router]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      dispatch(setAuthLoading(true));
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = await response.json();
        if (!active) return;

        if (response.ok && result.success && result.data) {
          dispatch(setAuthUser(result.data));
        } else {
          dispatch(clearAuth());
        }
      } catch {
        if (active) dispatch(clearAuth());
      } finally {
        if (active) {
          dispatch(setAuthLoading(false));
          dispatch(setAuthInitialized(true));
        }
      }
    };

    if (!isInitialized) {
      void restoreSession();
    }

    return () => {
      active = false;
    };
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;

    if (!isAuthenticated || !currentUser) {
      router.replace("/login");
      return;
    }

    void loadRecord();
  }, [isInitialized, authLoading, isAuthenticated, currentUser, loadRecord, router]);

  const fields = useMemo(() => Object.entries(record?.data ?? {}), [record]);

  const copyRecordId = async () => {
    if (!record) return;
    await navigator.clipboard.writeText(record.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#20382F]">
      <WorkspaceSidebar />
      <main className="min-h-screen lg:ml-[270px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / RECORDS</p>
            <p className="mt-1 text-sm font-bold text-[#263B32]">Record Details</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE4D9] bg-white px-3 text-[11px] font-semibold text-[#52685A] shadow-sm transition hover:bg-[#F4F7F1] sm:px-4">
              <ArrowLeft size={14} /><span className="sm:hidden"><ArrowLeft size={14} />Back</span>
            </button>
            <button onClick={() => void loadRecord()} disabled={loading} aria-label="Refresh record" title="Refresh record" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm transition hover:bg-[#174B38] disabled:opacity-60">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <WorkspaceProfileMenu />
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] px-5 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-9">
          <section className="mb-8 flex flex-col justify-between gap-4 border-b border-[#E3E6DE] pb-6 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#62796B]">Record workspace</span>
              </div>
              <h1 className="truncate text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">Record Details<span className="text-[#B99455]">.</span></h1>
              <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#78867D]">Inspect the complete record, metadata and related entries.</p>
            </div>
          </section>

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><div className="h-72 animate-pulse rounded-2xl border border-[#E5E8E1] bg-white" /><div className="h-72 animate-pulse rounded-2xl border border-[#E5E8E1] bg-white" /></div>
          ) : error ? (
            <section className="rounded-2xl border border-[#E9D8D2] bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAEFEC] text-[#B45D4D]"><XCircle size={22} /></div><h2 className="mt-4 text-lg font-bold text-[#243B31]">Unable to open record</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#78877E]">{error}</p><button onClick={() => void loadRecord()} className="mt-5 rounded-xl bg-[#142F28] px-5 py-2.5 text-xs font-semibold text-white">Try again</button></section>
          ) : record ? (
            <>
              <section className="mb-5 overflow-hidden rounded-2xl border border-[#E3E7DF] bg-white shadow-[0_8px_28px_rgba(24,55,44,0.035)]">
                <div className="flex flex-col gap-5 border-b border-[#EDF0EA] bg-gradient-to-r from-[#FDFDFB] to-[#F5F7F1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex min-w-0 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0E9] text-[#26745A]"><Database size={22} /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#829187]">{record.datasetName}</p><h2 className="mt-1 truncate text-xl font-bold text-[#18372C]">{record.externalId}</h2><p className="mt-1 text-xs text-[#829187]">Record identifier</p></div></div>
                  <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#34744B]"><CheckCircle2 size={13} /> Record loaded</span><button onClick={copyRecordId} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E1E7DE] bg-white px-3 text-xs font-semibold text-[#4C6658] hover:border-[#26745A]">{copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy ID"}</button></div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-7">
                  <Meta icon={Fingerprint} label="Record UUID" value={`${record.id.slice(0, 8)}…${record.id.slice(-8)}`} />
                  <Meta icon={Database} label="Dataset" value={record.datasetName} />
                  <Meta icon={CalendarDays} label="Created" value={dateTime(record.createdAt)} />
                  <Meta icon={Clock3} label="Last Updated" value={dateTime(record.updatedAt)} />
                </div>
              </section>

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
                <section className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-[0_8px_28px_rgba(24,55,44,0.035)] sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><FileJson2 size={18} className="text-[#26745A]" /><h3 className="text-base font-bold text-[#203B30]">Complete Record Information</h3></div><p className="mt-1 text-xs text-[#87948B]">All fields stored in this record</p></div><button onClick={() => setShowRaw(!showRaw)} className="rounded-lg border border-[#E2E8DF] px-3 py-2 text-[11px] font-semibold text-[#557062] hover:border-[#26745A]">{showRaw ? "Show fields" : "View JSON"}</button></div>
                  {showRaw ? <pre className="max-h-[560px] overflow-auto rounded-xl bg-[#142F28] p-4 text-xs leading-6 text-[#DDE9DF]">{JSON.stringify(record.data, null, 2)}</pre> : <div className="grid gap-0 sm:grid-cols-2">{fields.map(([key, value], index) => <div key={key} className={`min-w-0 border-b border-[#EEF1EB] py-4 ${index % 2 === 0 ? "sm:pr-6" : "sm:pl-6"}`}><p className="text-[10px] font-bold uppercase tracking-[1.3px] text-[#8A978F]">{prettyLabel(key)}</p><p className="mt-2 break-words text-sm font-semibold text-[#294438]">{displayValue(value)}</p></div>)}</div>}
                </section>

                <div className="space-y-5">
                  <section className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-[0_8px_28px_rgba(24,55,44,0.035)] sm:p-6">
                    <div className="mb-4 flex items-center gap-2"><Link2 size={17} className="text-[#26745A]" /><h3 className="text-sm font-bold text-[#203B30]">Related Records</h3><span className="ml-auto rounded-full bg-[#EDF3ED] px-2.5 py-1 text-[10px] font-bold text-[#52705F]">{record.relatedRecords.length}</span></div>
                    <p className="mb-4 text-xs leading-5 text-[#87948B]">Other records matching this customer in the same dataset.</p>
                    {record.relatedRecords.length ? <div className="space-y-2">{record.relatedRecords.map((item) => <button key={item.id} onClick={() => router.push(`/records/${item.id}?datasetId=${record.datasetId}`)} className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#EDF0EA] p-3 text-left transition hover:border-[#B7CCBD] hover:bg-[#F8FAF6]"><div className="min-w-0"><p className="truncate text-xs font-bold text-[#315344]">{item.externalId}</p><p className="mt-1 truncate text-[11px] text-[#8A978F]">{displayValue(item.data.product)} · {displayValue(item.data.status)}</p></div><ArrowUpRight size={15} className="shrink-0 text-[#9BA99F] group-hover:text-[#26745A]" /></button>)}</div> : <div className="rounded-xl border border-dashed border-[#E0E7DE] px-4 py-7 text-center"><Search size={18} className="mx-auto text-[#9BA99F]" /><p className="mt-2 text-xs font-semibold text-[#64796D]">No related records found</p><p className="mt-1 text-[11px] text-[#98A39C]">No matching customer entries were found.</p></div>}
                  </section>

                  <section className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-[0_8px_28px_rgba(24,55,44,0.035)] sm:p-6">
                    <div className="mb-3 flex items-center gap-2"><History size={17} className="text-[#26745A]" /><h3 className="text-sm font-bold text-[#203B30]">Historical Changes</h3></div>
                    <div className="rounded-xl bg-[#F7F8F4] p-4"><div className="flex items-center gap-2 text-[#7C8B81]"><ShieldCheck size={16} /><span className="text-xs font-semibold">History tracking not enabled</span></div><p className="mt-2 text-[11px] leading-5 text-[#89968E]">This database currently stores the latest record state and timestamps, but does not have a record revision history table. Created and updated dates are shown above.</p></div>
                  </section>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-[#EDF0EA] bg-[#FCFCFA] p-4"><div className="flex items-center gap-2 text-[#8A978F]"><Icon size={14} /><span className="text-[9px] font-bold uppercase tracking-[1.2px]">{label}</span></div><p title={value} className="mt-2 truncate text-xs font-semibold text-[#365547]">{value}</p></div>;
}
