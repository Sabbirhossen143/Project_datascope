"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceProfileMenu from "@/components/layout/WorkspaceProfileMenu";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Database,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  MapPinned,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthInitialized,
  setAuthLoading,
  setAuthUser,
} from "@/store/slices/authSlice";

const DATASET_ID = "81f7f864-4784-4117-80c3-2401f923e78e";

const CHART_COLORS = ["#26745A", "#D7B77A", "#8BA994", "#B77C55", "#5B7668", "#C8A65F"];

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

const money = (value: number) => `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const compactMoney = (value: number) => `৳${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0)}`;

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en", { month: "short", year: "2-digit" });
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  iconBg,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E7DF] bg-white p-5 shadow-[0_3px_16px_rgba(35,55,43,0.025)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#183C30]/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-[#7D8980]">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: accent, backgroundColor: iconBg }}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-5 break-words text-[25px] font-bold tracking-tight text-[#243A2E] sm:text-[28px]">{value}</p>
      <p className="mt-1 text-[10px] text-[#929B94]">{detail}</p>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children, className = "" }: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[20px] border border-[#E8E7DF] bg-white shadow-[0_4px_20px_rgba(35,55,43,0.03)] ${className}`}>
      <div className="flex items-center gap-3 border-b border-[#EFEFE9] px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3EC] text-[#286347]"><Icon size={17} /></span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-[#263B32]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#929B94]">{subtitle}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
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

export default function AnalyticsClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, isLoading: authLoading } = useAppSelector(
    (state) => state.auth,
  );
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the server session into Redux after a page refresh.
  useEffect(() => {
    if (isInitialized && isAuthenticated) return;

    let active = true;
    dispatch(setAuthLoading(true));

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) throw new Error("Authentication required");

        const result = await response.json();
        const user = result.user ?? result;
        if (!user?.id || !user?.role) throw new Error("Invalid session response");

        if (active) {
          dispatch(setAuthUser(user));
          dispatch(setAuthInitialized(true));
        }
      } catch {
        if (active) {
          dispatch(clearAuth());
          dispatch(setAuthInitialized(true));
          router.replace("/login");
        }
      } finally {
        if (active) dispatch(setAuthLoading(false));
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated, isInitialized, router]);

  const loadAnalytics = useCallback(async (quiet = false) => {
    if (!isAuthenticated) return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics?datasetId=${encodeURIComponent(DATASET_ID)}`, {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();
      if (response.status === 401) {
        dispatch(clearAuth());
        dispatch(setAuthInitialized(true));
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Unable to load analytics.");
      setData(result as AnalyticsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      setError(message);
      toast.error("Analytics unavailable", { description: message, duration: 3500 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, isAuthenticated, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) void loadAnalytics();
  }, [isAuthenticated, isInitialized, loadAnalytics]);

  const monthlyChartData = useMemo(() => (data?.monthlyRevenue ?? []).map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  })), [data]);

  const categoryChartData = data?.categorySales ?? [];
  const regionalChartData = data?.regionalPerformance ?? [];
  const statusChartData = data?.statusDistribution ?? [];
  const topProducts = data?.topProducts ?? [];

  if (!isInitialized || authLoading || !isAuthenticated) {
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
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E6DE] bg-[#F9F8F4]/95 pl-16 pr-4 backdrop-blur-xl sm:pl-16 sm:pr-7 lg:px-10">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#87948B]">WORKSPACE / ANALYTICS</p>
          <p className="mt-1 text-sm font-bold text-[#263B32]">Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE4D9] bg-white px-3 text-[11px] font-semibold text-[#52685A] shadow-sm transition hover:bg-[#F4F7F1] sm:px-4">
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Data Explorer</span><span className="sm:hidden">Back</span>
          </button>
          <button onClick={() => void loadAnalytics(true)} disabled={loading || refreshing} aria-label="Refresh analytics" title="Refresh analytics" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E6048] text-white shadow-sm transition hover:bg-[#174B38] disabled:opacity-60">
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
              <span className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#62796B]">Business intelligence</span>
            </div>
            <h1 className="text-[28px] font-bold tracking-[-1px] text-[#1D352A] sm:text-[36px]">Analytics overview<span className="text-[#B99455]">.</span></h1>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#78867D]">Understand revenue, transactions, products and regional performance across your dataset.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-[#DDE9DE] bg-[#EDF4EC] px-3 py-2 sm:self-auto">
            <Activity size={14} className="text-[#39845A]" />
            <span className="text-[10px] font-semibold text-[#39704E]">Live database analytics</span>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[22px] bg-[#183C30] p-6 text-white shadow-xl shadow-[#183C30]/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#D7B77A]/[0.07] blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#D7B77A]"><ChartNoAxesCombined size={16} /><span className="text-[10px] font-bold uppercase tracking-[2px]">Active dataset</span></div>
              <h2 className="mt-3 text-xl font-bold sm:text-[25px]">{data?.dataset.name ?? "Customer Transactions"}</h2>
              <p className="mt-2 text-xs text-[#C2D1C7]">Aggregated insights powered by PostgreSQL</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur-sm">
              <p className="text-[9px] font-semibold uppercase tracking-[1.5px] text-[#B9CFC1]">Total records analyzed</p>
              <p className="mt-2 text-2xl font-bold text-white">{loading ? "—" : (data?.overview.totalTransactions ?? 0).toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-[#B9CFC1]">Database-side aggregation</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[142px] animate-pulse rounded-2xl border border-[#E8E7DF] bg-white" />)}
          </div>
        ) : error && !data ? (
          <section className="rounded-2xl border border-[#E8D9D4] bg-white p-8 text-center">
            <p className="text-sm font-bold text-[#8F4B40]">We couldn’t load your analytics</p>
            <p className="mt-2 text-xs text-[#87948B]">{error}</p>
            <button onClick={() => void loadAnalytics()} className="mt-5 rounded-xl bg-[#1E6048] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#174B38]">Try again</button>
          </section>
        ) : data ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total revenue" value={money(data.overview.totalRevenue)} detail="Gross transaction amount" icon={CircleDollarSign} accent="#26745A" iconBg="#EAF2EA" />
              <MetricCard label="Total transactions" value={data.overview.totalTransactions.toLocaleString()} detail="Records in this dataset" icon={ShoppingCart} accent="#A17B42" iconBg="#F6F0E4" />
              <MetricCard label="Average order value" value={money(data.overview.averageOrderValue)} detail="Revenue per transaction" icon={TrendingUp} accent="#657D69" iconBg="#EDF1E9" />
              <MetricCard label="Units sold" value={data.overview.totalQuantity.toLocaleString()} detail="Combined product quantity" icon={Package} accent="#9A7650" iconBg="#F4EEE7" />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
              <Panel title="Monthly revenue" subtitle="Revenue trend across the latest 12 available months" icon={TrendingUp}>
                {monthlyChartData.length ? <div className="h-[290px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#26745A" stopOpacity={0.24} /><stop offset="95%" stopColor="#26745A" stopOpacity={0.015} /></linearGradient></defs>
                      <CartesianGrid stroke="#EEF0E9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="monthLabel" tick={{ fill: "#89958B", fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tickFormatter={(value) => compactMoney(Number(value))} tick={{ fill: "#89958B", fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#26745A" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, fill: "#D7B77A", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div> : <EmptyChart />}
              </Panel>

              <Panel title="Transaction status" subtitle="Distribution by order status" icon={Activity}>
                {statusChartData.length ? <div className="h-[290px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} dataKey="transactions" nameKey="status" cx="50%" cy="46%" innerRadius={67} outerRadius={100} paddingAngle={3} stroke="none">
                        {statusChartData.map((entry, index) => <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px", color: "#718176" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div> : <EmptyChart />}
              </Panel>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel title="Category performance" subtitle="Revenue generated by product category" icon={BarChart3}>
                {categoryChartData.length ? <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke="#EEF0E9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" tick={{ fill: "#89958B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => compactMoney(Number(value))} tick={{ fill: "#89958B", fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#26745A" radius={[6, 6, 0, 0]} maxBarSize={54} />
                    </BarChart>
                  </ResponsiveContainer>
                </div> : <EmptyChart />}
              </Panel>

              <Panel title="Regional performance" subtitle="Transaction revenue by customer region" icon={MapPinned}>
                {regionalChartData.length ? <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalChartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke="#EEF0E9" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => compactMoney(Number(value))} tick={{ fill: "#89958B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="region" width={82} tick={{ fill: "#718176", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#B99455" radius={[0, 6, 6, 0]} maxBarSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div> : <EmptyChart />}
              </Panel>
            </section>

            <Panel title="Top selling products" subtitle="Products ranked by total revenue" icon={Package}>
              {topProducts.length ? <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead><tr className="border-b border-[#EEF0E9] text-[9px] font-bold uppercase tracking-[1px] text-[#89958B]"><th className="px-3 py-3">Product</th><th className="px-3 py-3 text-right">Units sold</th><th className="px-3 py-3 text-right">Transactions</th><th className="px-3 py-3 text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-[#F0F0EA]">{topProducts.map((product, index) => <tr key={product.product} className="transition hover:bg-[#FAFBF8]"><td className="px-3 py-4"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDF3EC] text-[10px] font-bold text-[#286347]">{index + 1}</span><span className="text-xs font-semibold text-[#344A3B]">{product.product}</span></div></td><td className="px-3 py-4 text-right text-xs text-[#65766A]">{product.quantity.toLocaleString()}</td><td className="px-3 py-4 text-right text-xs text-[#65766A]">{product.transactions.toLocaleString()}</td><td className="px-3 py-4 text-right text-xs font-bold text-[#286347]">{money(product.revenue)}</td></tr>)}</tbody>
                </table>
              </div> : <EmptyChart />}
            </Panel>
          </>
        ) : null}

        <footer className="flex flex-col justify-between gap-2 pb-3 text-[10px] text-[#98A198] sm:flex-row">
          <p>© 2026 DataScope. Data Intelligence Platform.</p>
          <div className="flex items-center gap-2"><CalendarDays size={13} /><span>Customer Transactions Workspace</span><span className="mx-1 text-[#C7C9C0]">·</span><span className="text-[#548263]">{refreshing ? "Updating..." : "Analytics synced"}</span></div>
        </footer>
      </div>
      </main>
    </>
  );
}

function EmptyChart() {
  return <div className="flex h-[250px] flex-col items-center justify-center text-center"><BarChart3 size={25} className="text-[#A5B0A6]" /><p className="mt-3 text-xs font-semibold text-[#53685A]">No analytics data available</p><p className="mt-1 text-[10px] text-[#9AA49B]">Data will appear when records are available.</p></div>;
}
