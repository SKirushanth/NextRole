import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Command,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Sparkles,
  Users,
  XCircle,
  Gift,
} from "lucide-react";
import type { ApplicationResponse, ApplicationStatus, UserResponse } from "../types";

export interface DashboardHomeProps {
  user: UserResponse | null;
  onNavigateToApps: () => void;
}

const LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_ORDER: ApplicationStatus[] = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"];

interface StatusStyle {
  color: string;
  badge: string;
  dot: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_STYLES: Record<ApplicationStatus, StatusStyle> = {
  APPLIED: {
    color: "#0284c7",
    badge: "bg-sky-500/[0.08] text-sky-700 border-sky-600/20",
    dot: "bg-sky-600",
    icon: Send,
  },
  INTERVIEWING: {
    color: "#4f46e5",
    badge: "bg-indigo-500/[0.08] text-indigo-700 border-indigo-600/20",
    dot: "bg-indigo-600",
    icon: Users,
  },
  OFFER: {
    color: "#059669",
    badge: "bg-emerald-500/[0.08] text-emerald-700 border-emerald-600/20",
    dot: "bg-emerald-600",
    icon: Gift,
  },
  REJECTED: {
    color: "#e11d48",
    badge: "bg-rose-500/[0.08] text-rose-700 border-rose-600/20",
    dot: "bg-rose-600",
    icon: XCircle,
  },
};

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function monogramStyle(company: string): string {
  const styles = [
    "bg-zinc-900 text-white border-zinc-800",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-sky-50 text-sky-700 border-sky-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  ];
  let hash = 0;
  for (let index = 0; index < company.length; index += 1) {
    hash = company.charCodeAt(index) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
}

function badge(status: ApplicationStatus): StatusStyle {
  return STATUS_STYLES[status] || STATUS_STYLES.APPLIED;
}

export default function DashboardHome({ user, onNavigateToApps }: DashboardHomeProps) {
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [quickCompany, setQuickCompany] = useState<string>("");
  const [quickRole, setQuickRole] = useState<string>("");
  const [quickStatus, setQuickStatus] = useState<ApplicationStatus>("APPLIED");
  const [quickSaving, setQuickSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setApps((await api.listApplications()) || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("dashboard-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleQuickAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickCompany.trim() || !quickRole.trim()) return;

    setQuickSaving(true);
    try {
      await api.createApplication({
        company_name: quickCompany.trim(),
        job_title: quickRole.trim(),
        status: quickStatus,
      });
      setQuickCompany("");
      setQuickRole("");
      setQuickStatus("APPLIED");
      setToast(`Logged ${quickRole.trim()} at ${quickCompany.trim()}`);
      await loadData();
    } catch (err) {
      console.error("Failed to quick save application:", err);
    } finally {
      setQuickSaving(false);
    }
  }

  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return apps.filter((app) => {
      const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
      const matchesQuery =
        !query ||
        app.job_title?.toLowerCase().includes(query) ||
        app.company_name?.toLowerCase().includes(query) ||
        LABELS[app.status]?.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [apps, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#737373] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-xs font-mono">Loading dashboard overview…</span>
      </div>
    );
  }

  const total = apps.length;
  const upcomingInterviews = apps.filter((app) => app.interview_date);
  const metrics = STATUS_ORDER.map((status) => ({
    status,
    count: apps.filter((app) => app.status === status).length,
  }));
  const applicationsHistory = [30, 45, 60, 90, 70, Math.min(100, (total / 10) * 100 || 20)];
  const interviewHistory = [10, 15, 25, 45, 20, Math.min(100, (upcomingInterviews.length / 5) * 100 || 15)];
  const card =
    "bg-white border border-black/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-150";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-zinc-500">
              Overview
            </p>
            <span className="text-zinc-300">/</span>
            <span className="text-[11px] font-medium text-zinc-500">Q4 Pipeline</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Good day, {user?.email?.split("@")[0] || "User"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="dashboard-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search roles or companies..."
              className="w-full pl-8 pr-14 py-2 text-[13px] rounded-lg bg-white border border-black/[0.08] text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 border border-black/[0.06] rounded absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-1">
        {metrics.map((metric) => {
          const style = badge(metric.status);
          const percentage = total ? Math.round((metric.count / total) * 100) : 0;
          const Icon = style.icon;
          const selected = statusFilter === metric.status;
          return (
            <button
              type="button"
              key={metric.status}
              onClick={() => setStatusFilter(selected ? "ALL" : metric.status)}
              className={`${card} text-left rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-black/[0.14] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] ${
                selected ? "ring-2 ring-indigo-500/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-700">
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`tabular-nums inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${style.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {percentage}%
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-medium text-zinc-500">{LABELS[metric.status]}</p>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
                    Share <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <span className="tabular-nums text-3xl font-semibold tracking-tight text-zinc-950 leading-none">
                    {metric.count}
                  </span>
                  <div className="w-28 h-1.5 rounded-full bg-zinc-100 overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: style.color }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className={`${card} lg:col-span-5 rounded-xl p-5`}>
          <div className="flex items-start justify-between mb-3.5">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">
                Recent applications
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Your latest pipeline activity</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToApps}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 mb-3.5 rounded-lg bg-zinc-100/90 border border-black/[0.05] overflow-x-auto">
            {(["ALL", "APPLIED", "INTERVIEWING", "OFFER"] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                  statusFilter === tab
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab === "ALL" ? "All" : LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredApps.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                <p className="text-xs font-medium text-zinc-500">
                  No applications match your filter
                </p>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className="mt-2 text-[11px] font-medium text-indigo-600 hover:underline"
                >
                  Reset filter
                </button>
              </div>
            ) : (
              filteredApps.slice(0, 5).map((app) => {
                const style = badge(app.status);
                const jobUrl = app.job_url || app.url;
                return (
                  <div
                    key={app.id}
                    className="group p-3 rounded-xl bg-zinc-50/60 border border-black/[0.06] hover:bg-white hover:border-black/[0.14] hover:shadow-sm transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-semibold tracking-tight shrink-0 shadow-sm ${monogramStyle(
                          app.company_name || ""
                        )}`}
                      >
                        {(app.company_name || "NA").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-950 truncate group-hover:text-indigo-600 transition-colors">
                          {app.job_title}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{app.company_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {LABELS[app.status] || app.status}
                      </span>
                      <span className="tabular-nums text-[11px] text-zinc-400 flex items-center gap-1">
                        {jobUrl && <ExternalLink className="w-3 h-3" />}
                        {jobUrl
                          ? "Link"
                          : app.interview_date
                          ? formatDate(app.interview_date)
                          : "No link"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          className={`${card} lg:col-span-4 rounded-xl p-5 flex flex-col justify-between min-h-[372px]`}
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">
                  Upcoming interviews
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Your scheduled meetings</p>
              </div>
              <span className="tabular-nums text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                {upcomingInterviews.length}
              </span>
            </div>
            {upcomingInterviews.length ? (
              upcomingInterviews.slice(0, 1).map((app) => (
                <div
                  key={app.id}
                  className="group p-3.5 rounded-xl bg-zinc-50/80 border border-black/[0.07] hover:bg-white hover:border-black/[0.15] hover:shadow-sm transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-white border border-black/[0.08] flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-950 truncate">
                        {app.company_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{formatDate(app.interview_date)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-zinc-500">
                <Calendar className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                No upcoming interviews scheduled.
              </div>
            )}
          </div>
          <div className="pt-4 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Calendar synced
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Google Meet
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <ChartCard
            title="Applications"
            value={total}
            label="Active pipeline"
            bars={applicationsHistory}
          />
          <ChartCard
            title="Interviews"
            value={upcomingInterviews.length}
            label="Scheduled"
            bars={interviewHistory}
          />
          <div className={`${card} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-zinc-950">Quick log</h3>
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <form onSubmit={handleQuickAdd} className="space-y-2.5">
              <QuickInput
                icon={Building2}
                value={quickCompany}
                onChange={setQuickCompany}
                placeholder="Company name"
              />
              <QuickInput
                icon={Briefcase}
                value={quickRole}
                onChange={setQuickRole}
                placeholder="Job role"
              />
              <div className="flex items-center gap-2 pt-0.5">
                <select
                  value={quickStatus}
                  onChange={(event) =>
                    setQuickStatus(event.target.value as ApplicationStatus)
                  }
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 border border-black/[0.08] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {LABELS[status]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={quickSaving}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {quickSaving ? "..." : "Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-950 text-white text-xs font-medium px-3.5 py-2.5 rounded-xl shadow-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  value: number;
  label: string;
  bars: number[];
}

function ChartCard({ title, value, label, bars }: ChartCardProps) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[13px] font-semibold text-zinc-950">{title}</h3>
        <span className="text-[11px] text-zinc-400">Last 6 months</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="tabular-nums text-xl font-semibold tracking-tight text-zinc-950">
          {value}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border bg-indigo-500/[0.08] text-indigo-700 border-indigo-600/20">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-2 items-end h-14 pt-2">
        {bars.map((height, index) => (
          <div key={MONTHS[index]} className="relative flex flex-col items-center gap-1.5 group">
            <div className="w-full h-9 rounded-t bg-zinc-100 flex items-end overflow-hidden">
              <div
                className={`w-full rounded-t transition-all ${
                  index === bars.length - 1
                    ? "bg-indigo-600"
                    : "bg-zinc-300 group-hover:bg-zinc-400"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
            <span
              className={`text-[10px] ${
                index === bars.length - 1 ? "font-semibold text-zinc-800" : "text-zinc-400"
              }`}
            >
              {MONTHS[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface QuickInputProps {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function QuickInput({ icon: Icon, placeholder, value, onChange }: QuickInputProps) {
  return (
    <div className="relative">
      <Icon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-zinc-50 border border-black/[0.08] text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
    </div>
  );
}
