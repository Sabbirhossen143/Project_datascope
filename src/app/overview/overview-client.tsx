"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3,
  CalendarDays, ChartNoAxesCombined, CircleDollarSign, Database,
  RefreshCw, ShoppingCart, Users, UserRound, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAuthUser,
  setAuthLoading,
  setAuthInitialized,
  clearAuth,
} from "@/store/slices/authSlice";

const DATASET_ID = "81f7f864-4784-4117-80c3-2401f923e78e";
const COLORS = ["#26745A", "#D7B77A", "#8BA994", "#B77C55", "#5B7668", "#C8A65F"];

type AnalyticsData = {
  success: boolean;
  dataset: { id: string; name: string; slug: string };
  overview: {
    totalTransactions: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalQuantity: number;
  };
  monthlyRevenue: { month: string; revenue: number; transactions: number }[];
  statusDistribution: { status: string; transactions: number; revenue: number }[];
  categorySales: { category: string; revenue: number; transactions: number; quantity: number }[];
  regionalPerformance: { region: string; revenue: number; transactions: number }[];
  topProducts: { product: string; revenue: number; quantity: number; transactions: number }[];
};

type RecentRecord = {
  id: string;
  externalId?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

type RecordsResult = { data?: RecentRecord[]; pagination?: { total?: number } };

const money = (value: number) =>
  `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const compactMoney = (value: number) =>
  `৳${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0)}`;

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year && month
    ? new Date(year, month - 1, 1).toLocaleDateString("en", { month: "short" })
    : value;
}

function MetricCard({
  label, value, helper, icon: Icon, trend, tint,
}: {
  label: string; value: string; helper: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  trend?: string; tint: string;
}) {
  return (
    <div className="group rounded-[19px] border border-[#E8E7DF] bg-white p-5 shadow-[0_3px_16px_rgba(35,55,43,0.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#183C30]/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-[#7D8980]">{label}</p>
          <p className="mt-4 break-words text-[25px] font-bold tracking-tight text-[#243A2E] sm:text-[28px]">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: tint, backgroundColor: `${tint}14` }}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#929B94]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#70A17D]" />{helper}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, action }: {
  title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.03)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#EFEFE9] px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-[#263B32]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#929B94]">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E5E8DF] bg-white px-3 py-2.5 shadow-xl">
      <p className="mb-1.5 text-[10px] font-semibold text-[#718176]">{label}</p>
      {payload.map((item, index) => (
        <p key={`${item.name}-${index}`} className="text-[11px] font-bold text-[#263B32]">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color ?? "#26745A" }} />
          {item.name}: {item.name?.toLowerCase().includes("revenue") ? money(Number(item.value)) : Number(item.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function OverviewClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authInitialized = useAppSelector((state) => state.auth.isInitialized);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the server session into the shared Redux auth state.
  useEffect(() => {
    let active = true;
    dispatch(setAuthLoading(true));

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) throw new Error("Authentication required");
        const result = await response.json();
        const user = result.user ?? result;

        if (!user?.id || !user?.role) {
          throw new Error("Invalid session response");
        }

        if (active) dispatch(setAuthUser(user));
      } catch {
        if (active) {
          dispatch(clearAuth());
          router.replace("/login");
        }
      } finally {
        if (active) {
          dispatch(setAuthLoading(false));
          dispatch(setAuthInitialized(true));
        }
      }
    }

    void restoreSession();
    return () => { active = false; };
  }, [dispatch, router]);

  const loadOverview = useCallback(async (quiet = false) => {
    if (!isAuthenticated || !currentUser) return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [analyticsResponse, recordsResponse] = await Promise.all([
        fetch(`/api/analytics?datasetId=${encodeURIComponent(DATASET_ID)}`, { cache: "no-store" }),
        fetch(`/api/records?datasetId=${encodeURIComponent(DATASET_ID)}&page=1&pageSize=6&sortBy=createdAt&sortOrder=desc`, { cache: "no-store" }),
      ]);
      if (analyticsResponse.status === 401 || recordsResponse.status === 401) {
        dispatch(clearAuth());
        dispatch(setAuthInitialized(true));
        router.replace("/login");
        return;
      }
      const analyticsResult = await analyticsResponse.json();
      const recordsResult = await recordsResponse.json();
      if (!analyticsResponse.ok) throw new Error(analyticsResult.message ?? "Unable to load workspace overview.");
      if (!recordsResponse.ok) throw new Error(recordsResult.message ?? "Unable to load recent records.");
      setAnalytics(analyticsResult as AnalyticsData);
      setRecent((recordsResult as RecordsResult).data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      setError(message);
      toast.error("Overview unavailable", { description: message, duration: 3500 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, dispatch, isAuthenticated, router]);

  useEffect(() => {
    if (authInitialized && isAuthenticated && currentUser) {
      void loadOverview();
    }
  }, [authInitialized, currentUser, isAuthenticated, loadOverview]);

  const monthly = useMemo(() => (analytics?.monthlyRevenue ?? []).map((item) => ({
    ...item, label: monthLabel(item.month),
  })), [analytics]);

  const overview = analytics?.overview;
  const status = analytics?.statusDistribution ?? [];
  const categories = analytics?.categorySales ?? [];

  const recordValue = (record: RecentRecord, key: string) =>
    String(record.data?.[key] ?? "—");

  if (!authInitialized || !currentUser || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#26745A] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold text-[#718176]">Loading your DataScope workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceSidebar />
      <main className="min-h-screen bg-[#F5F4EF] text-[#263B32] lg:ml-[270px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[1.8px] text-[#9A9F94]">Workspace / Overview</p>
            <h1 className="mt-0.5 text-[17px] font-bold tracking-tight text-[#1D352A]">Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#DDE9DE] bg-[#EDF4EC] px-3 py-2 text-[10px] font-semibold text-[#39704E] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" /> Live data
            </span>
            <button onClick={() => void loadOverview(true)} disabled={loading || refreshing} aria-label="Refresh overview" title="Refresh overview" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm transition hover:bg-[#174B38] disabled:opacity-60">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <WorkspaceProfileMenu />
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-7 lg:p-10">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4E8DF] bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39845A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#62796B]">Workspace snapshot</span>
              </div>
              <h2 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">Good data. Clear decisions<span className="text-[#B99455]">.</span></h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#78867D]">A live summary of your connected dataset, transaction activity and business performance.</p>
            </div>
            <button onClick={() => router.push("/")} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-[#183C30] px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#245640] sm:self-auto">
              Explore dataset <ArrowRight size={14} />
            </button>
          </section>

          {error && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E8D9C9] bg-[#FFF9F1] p-4 sm:flex-row sm:items-center">
              <p className="text-xs text-[#8B6244]">{error}</p>
              <button onClick={() => void loadOverview()} className="text-xs font-bold text-[#725036]">Try again</button>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total records" value={loading ? "—" : (overview?.totalTransactions ?? 0).toLocaleString("en-US")} helper="Records in connected dataset" icon={Database} tint="#26745A" />
            <MetricCard label="Total revenue" value={loading ? "—" : money(overview?.totalRevenue ?? 0)} helper="Combined transaction value" icon={CircleDollarSign} tint="#B58D4E" />
            <MetricCard label="Average order value" value={loading ? "—" : money(overview?.averageOrderValue ?? 0)} helper="Revenue per transaction" icon={ShoppingCart} tint="#668A76" />
            <MetricCard label="Units sold" value={loading ? "—" : (overview?.totalQuantity ?? 0).toLocaleString("en-US")} helper="Total quantity across orders" icon={Users} tint="#A87555" />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
            <Panel title="Revenue performance" subtitle="Monthly revenue across the connected dataset" action={<span className="rounded-lg bg-[#EDF4EC] px-2.5 py-1.5 text-[9px] font-bold text-[#39704E]">MONTHLY</span>}>
              {loading ? <div className="h-[270px] animate-pulse rounded-xl bg-[#F4F5F0]" /> : monthly.length ? (
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                      <defs><linearGradient id="overviewRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#26745A" stopOpacity={0.2} /><stop offset="100%" stopColor="#26745A" stopOpacity={0.01} /></linearGradient></defs>
                      <CartesianGrid stroke="#EEF0E9" strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#8B978E", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#8B978E", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#26745A" strokeWidth={2.5} fill="url(#overviewRevenueFill)" activeDot={{ r: 5, fill: "#D7B77A", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="flex h-[270px] items-center justify-center text-xs text-[#929B94]">No monthly revenue data available.</div>}
            </Panel>

            <Panel title="Order status" subtitle="Transaction distribution by status">
              {loading ? <div className="h-[270px] animate-pulse rounded-xl bg-[#F4F5F0]" /> : status.length ? (
                <div className="flex h-[270px] flex-col items-center justify-center">
                  <div className="h-[190px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={status} dataKey="transactions" nameKey="status" innerRadius={57} outerRadius={82} paddingAngle={3} stroke="none">
                          {status.map((entry, index) => <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {status.map((item, index) => <span key={item.status} className="inline-flex items-center gap-1.5 text-[10px] text-[#718176]"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.status} <b className="text-[#34483B]">{item.transactions.toLocaleString()}</b></span>)}
                  </div>
                </div>
              ) : <div className="flex h-[270px] items-center justify-center text-xs text-[#929B94]">No status data available.</div>}
            </Panel>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel title="Category performance" subtitle="Revenue contribution by product category" action={<BarChart3 size={16} className="text-[#8B978E]" />}>
              {loading ? <div className="h-[250px] animate-pulse rounded-xl bg-[#F4F5F0]" /> : categories.length ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories.slice(0, 6)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="#EEF0E9" strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="category" tick={{ fill: "#8B978E", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#8B978E", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={38}>
                        {categories.slice(0, 6).map((item, index) => <Cell key={item.category} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="flex h-[250px] items-center justify-center text-xs text-[#929B94]">No category data available.</div>}
            </Panel>

            <Panel title="Top products" subtitle="Products ranked by revenue" action={<ChartNoAxesCombined size={16} className="text-[#8B978E]" />}>
              <div className="space-y-4">
                {(analytics?.topProducts ?? []).slice(0, 5).map((product, index) => {
                  const max = Math.max(...(analytics?.topProducts ?? []).map((item) => item.revenue), 1);
                  return <div key={product.product}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0F3ED] text-[10px] font-bold text-[#567262]">{String(index + 1).padStart(2, "0")}</span>
                        <span className="truncate text-[11px] font-semibold text-[#42574A]">{product.product}</span>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-[#263B32]">{money(product.revenue)}</span>
                    </div>
                    <div className="ml-[38px] h-1.5 overflow-hidden rounded-full bg-[#F0F1EC]"><div className="h-full rounded-full bg-[#26745A]" style={{ width: `${Math.max(3, product.revenue / max * 100)}%` }} /></div>
                  </div>;
                })}
                {!loading && !(analytics?.topProducts?.length) && <p className="py-12 text-center text-xs text-[#929B94]">No product data available.</p>}
                {loading && <div className="h-[210px] animate-pulse rounded-xl bg-[#F4F5F0]" />}
              </div>
            </Panel>
          </section>

          <Panel title="Recent transactions" subtitle="Latest records from your dataset" action={<button onClick={() => router.push("/")} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#39704E] hover:text-[#1D4D38]">View all <ArrowRight size={12} /></button>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead><tr className="border-b border-[#EEF0E9] text-[9px] font-bold uppercase tracking-[1px] text-[#98A197]">
                  <th className="px-3 py-3">Transaction</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {recent.map((record) => {
                    const statusValue = recordValue(record, "status");
                    return <tr key={record.id} className="border-b border-[#F1F2ED] last:border-0 hover:bg-[#FAFBF8]">
                      <td className="px-3 py-3 text-[10px] font-semibold text-[#587061]">{recordValue(record, "transactionId")}</td>
                      <td className="max-w-[150px] truncate px-3 py-3 text-[10px] text-[#506256]">{recordValue(record, "customerName")}</td>
                      <td className="px-3 py-3 text-[10px] text-[#506256]">{recordValue(record, "product")}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-[#EDF4EC] px-2.5 py-1 text-[9px] font-semibold text-[#39704E]">{statusValue}</span></td>
                      <td className="px-3 py-3 text-right text-[10px] font-bold text-[#34483B]">{money(Number(record.data?.amount ?? 0))}</td>
                    </tr>;
                  })}
                  {!loading && recent.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-xs text-[#929B94]">No recent transactions found.</td></tr>}
                  {loading && <tr><td colSpan={5} className="px-3 py-10 text-center text-xs text-[#929B94]">Loading recent transactions…</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>

          <footer className="flex flex-col justify-between gap-2 border-t border-[#E7E6DE] py-4 text-[10px] text-[#98A197] sm:flex-row sm:items-center">
            <span>{analytics?.dataset?.name ?? "DataScope workspace"}</span>
            <span className="inline-flex items-center gap-1.5"><Activity size={12} /> Metrics are calculated from live database records</span>
          </footer>
        </div>
      </main>
    </>
  );
}
