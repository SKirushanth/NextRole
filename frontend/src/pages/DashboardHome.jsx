import { useCallback, useEffect, useState } from "react";
import { api, STATUSES } from "../lib/api.js";
import { formatDate } from "../lib/dates.js";
import {
  Plus,
  Send,
  Users,
  Gift,
  XCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Building2,
  Calendar,
  Loader2,
  Search,
  Briefcase,
  Trophy,
} from "lucide-react";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_CONFIG = {
  APPLIED: {
    color: "#0284c7",
    background: "rgba(14, 165, 233, 0.10)",
    border: "rgba(14, 165, 233, 0.22)",
    icon: Send,
  },
  INTERVIEWING: {
    color: "#4f46e5",
    background: "rgba(99, 102, 241, 0.10)",
    border: "rgba(99, 102, 241, 0.22)",
    icon: Users,
  },
  OFFER: {
    color: "#059669",
    background: "rgba(16, 185, 129, 0.10)",
    border: "rgba(16, 185, 129, 0.22)",
    icon: Gift,
  },
  REJECTED: {
    color: "#e11d48",
    background: "rgba(244, 63, 94, 0.10)",
    border: "rgba(244, 63, 94, 0.22)",
    icon: XCircle,
  },
};

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

export default function DashboardHome({ user, onNavigateToApps }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickCompany, setQuickCompany] = useState("");
  const [quickRole, setQuickRole] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

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

  async function handleQuickAdd(event) {
    event.preventDefault();
    if (!quickCompany.trim() || !quickRole.trim()) return;

    setQuickSaving(true);
    try {
      await api.createApplication({
        company_name: quickCompany.trim(),
        job_title: quickRole.trim(),
        status: "APPLIED",
      });
      setQuickCompany("");
      setQuickRole("");
      await loadData();
    } catch (err) {
      console.error("Failed to quick save application:", err);
    } finally {
      setQuickSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#737373] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
        <span className="text-xs font-mono">Loading dashboard overview…</span>
      </div>
    );
  }

  const total = apps.length;
  const recentApps = apps.slice(0, 5);
  const upcomingInterviews = apps.filter((app) => app.interview_date);
  const appBars = [30, 45, 60, 90, 70, Math.min(100, (total / 10) * 100 || 20)];
  const interviewBars = [
    10,
    15,
    25,
    45,
    20,
    Math.min(100, (upcomingInterviews.length / 5) * 100 || 15),
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-[#737373] uppercase tracking-[0.08em] mb-1">
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-[#FFFFFF] tracking-tight">
            Good day, {user?.email?.split("@")[0] || "User"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              placeholder="Search applications"
              className="w-full bg-[#121212] border border-[#262626] rounded-xl py-2.5 pl-10 pr-3 text-xs text-[#FFFFFF] placeholder-[#525252] focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div>
          <button
            onClick={onNavigateToApps}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New application</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED;
          const count = apps.filter((app) => app.status === status).length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = config.icon;

          return (
            <div
              key={status}
              className="relative overflow-hidden bg-[#121212] border border-[#262626] rounded-xl p-5 min-h-[132px] flex flex-col justify-between shadow-sm"
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: config.color }}
              />
              <div className="flex items-center justify-between">
                <div
                  className="p-2 rounded-lg border"
                  style={{
                    color: config.color,
                    backgroundColor: config.background,
                    borderColor: config.border,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: config.color, backgroundColor: config.background }}
                >
                  {percentage}%
                </span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-[#888888]">{LABELS[status]}</p>
                  <p className="text-2xl font-bold text-[#FFFFFF] tracking-tight mt-0.5">
                    {count}
                  </p>
                </div>
                <div className="w-20 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: config.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-5 bg-[#121212] border border-[#262626] rounded-xl p-5 flex flex-col min-h-[360px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF]">Recent applications</h2>
              <p className="text-[11px] text-[#737373] mt-1">Latest updates in your pipeline</p>
            </div>
            <button
              onClick={onNavigateToApps}
              className="text-xs text-[#A855F7] hover:text-[#C084FC] inline-flex items-center gap-1 cursor-pointer"
            >
              View board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[#737373] text-center">
              No applications recorded yet.
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              {recentApps.map((app) => {
                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED;
                const jobUrl = app.job_url || app.url;

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-[#181818] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-[#888888]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#FFFFFF] truncate">{app.job_title}</p>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5">{app.company_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          color: config.color,
                          backgroundColor: config.background,
                          borderColor: config.border,
                        }}
                      >
                        {LABELS[app.status] || app.status}
                      </span>
                      {jobUrl ? (
                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#737373] hover:text-[#FFFFFF] inline-flex items-center gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Link
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#525252]">
                          {app.interview_date ? formatDate(app.interview_date) : "No link"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 bg-[#121212] border border-[#262626] rounded-xl p-5 min-h-[360px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <h2 className="text-sm font-semibold text-[#FFFFFF]">Upcoming interviews</h2>
              <p className="text-[11px] text-[#737373] mt-1">Your scheduled meetings</p>
            </div>
            <span className="text-xs font-mono text-[#A3A3A3] bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-[#262626]">
              {upcomingInterviews.length}
            </span>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="h-[270px] flex flex-col items-center justify-center text-center text-xs text-[#737373] gap-2">
              <Calendar className="w-5 h-5 text-[#525252]" />
              No upcoming interviews scheduled.
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcomingInterviews.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-2.5 bg-[#161616] rounded-lg border border-[#262626]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#FFFFFF] truncate">{app.company_name}</p>
                      <p className="text-[10px] text-[#3B82F6] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {formatDate(app.interview_date)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#525252] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-3 flex flex-col gap-4">
          <ChartCard
            title="Applications"
            value={total}
            label="Active pipeline"
            color="#3B82F6"
            bars={appBars}
          />
          <ChartCard
            title="Interviews"
            value={upcomingInterviews.length}
            label="Scheduled"
            color="#A855F7"
            bars={interviewBars}
          />
          <form
            onSubmit={handleQuickAdd}
            className="bg-[#121212] border border-[#262626] rounded-xl p-4 flex-1 min-h-[176px] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#FFFFFF]">Quick log</span>
                <Trophy className="w-4 h-4 text-[#525252]" />
              </div>
              <div className="space-y-2">
                <QuickInput
                  icon={Building2}
                  placeholder="Company name"
                  value={quickCompany}
                  onChange={setQuickCompany}
                />
                <QuickInput
                  icon={Briefcase}
                  placeholder="Job role"
                  value={quickRole}
                  onChange={setQuickRole}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={quickSaving}
              className="w-full mt-3 py-2.5 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#0A0A0A] rounded-lg text-xs font-semibold transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {quickSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Save application
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, value, label, color, bars }) {
  return (
    <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#FFFFFF]">{title}</span>
        <span className="text-[10px] text-[#737373]">Last 6 months</span>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-lg font-bold text-[#FFFFFF]">{value}</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}1F` }}>
          {label}
        </span>
      </div>
      <div className="h-16 flex items-end justify-between gap-1.5 mt-3">
        {bars.map((height, index) => (
          <div key={months[index]} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div
              className="w-full rounded-sm"
              style={{ height: `${height}%`, backgroundColor: index === bars.length - 1 ? color : `${color}38` }}
            />
            <span className="text-[9px] text-[#525252]">{months[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickInput({ icon: Icon, placeholder, value, onChange }) {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-lg px-2.5 py-2 flex items-center gap-2 focus-within:border-[#444444]">
      <Icon className="w-3.5 h-3.5 text-[#737373] shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-xs text-[#FFFFFF] placeholder-[#525252] focus:outline-none"
        required
      />
    </div>
  );
}
