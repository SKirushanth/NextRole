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
  Rocket,
  Building2,
  Calendar,
  Loader2
} from "lucide-react";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_CONFIG = {
  APPLIED: {
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
    icon: Send,
  },
  INTERVIEWING: {
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.25)",
    icon: Users,
  },
  OFFER: {
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.25)",
    icon: Gift,
  },
  REJECTED: {
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    icon: XCircle,
  },
};

export default function DashboardHome({ user, onNavigateToApps }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await api.listApplications();
      setApps(data || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const total = apps.length;
  const username = user?.email ? user.email.split("@")[0] : "User";
  const recentApps = apps.slice(0, 5);
  const upcomingInterviews = apps.filter((a) => a.interview_date);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#888888] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
        <span className="text-xs font-mono">Loading dashboard overview…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tight flex items-center gap-2">
            <span>👋</span> Good day, {username}!
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Here is your job application pipeline overview.
          </p>
        </div>

        <button
          onClick={onNavigateToApps}
          className="bg-[#FFFFFF] text-[#0A0A0A] font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#E5E5E5] transition-all cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STATUSES.map((status) => {
          const count = apps.filter((a) => a.status === status).length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED;
          const IconComponent = config.icon;

          return (
            <div
              key={status}
              className="relative overflow-hidden bg-[#121212] border border-[#262626] rounded-xl p-4 space-y-3 hover:border-[#333333] transition-colors"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: config.color }}
              />

              <div className="flex justify-between items-center">
                <div
                  className="p-2 rounded-lg border"
                  style={{
                    backgroundColor: config.bg,
                    borderColor: config.border,
                    color: config.color,
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <span
                  className="font-mono text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    color: config.color,
                    backgroundColor: config.bg,
                  }}
                >
                  {percentage}%
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-[#888888]">{LABELS[status]}</p>
                <p className="text-2xl font-bold text-[#FFFFFF] tracking-tight mt-0.5">
                  {count}
                </p>
              </div>

              <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Applications & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Card */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#262626] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <h2 className="text-sm font-semibold text-[#FFFFFF]">Recent Applications</h2>
            <button
              onClick={onNavigateToApps}
              className="text-xs text-[#9D4EDD] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#888888]">
              No applications recorded yet. Add your first job application to get started!
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentApps.map((app) => {
                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED;
                const jobUrl = app.job_url || app.url;

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3.5 bg-[#161616] border border-[#262626] hover:border-[#3A3A3A] rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A] text-[#888888] shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-[#FFFFFF] truncate">
                          {app.company_name}
                        </p>
                        <p className="text-[11px] text-[#888888] truncate">{app.job_title}</p>
                        {jobUrl && (
                          <a
                            href={jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#9D4EDD] hover:underline inline-flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">Job Link</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1 shrink-0 ml-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block border"
                        style={{
                          color: config.color,
                          backgroundColor: config.bg,
                          borderColor: config.border,
                        }}
                      >
                        ● {LABELS[app.status] || app.status}
                      </span>
                      {app.interview_date && (
                        <p className="text-[10px] text-[#888888] flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(app.interview_date)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Widgets */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#9D4EDD]" />
                <h2 className="text-sm font-semibold text-[#FFFFFF]">Upcoming Interviews</h2>
              </div>
              <span className="text-xs font-mono text-[#888888]">{upcomingInterviews.length}</span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <p className="text-xs text-[#888888] py-4 text-center">
                No upcoming interviews scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-[#161616] border border-[#262626] rounded-xl flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#FFFFFF] truncate">
                        {app.company_name}
                      </p>
                      <p className="text-[11px] text-[#22C55E] font-medium mt-0.5">
                        {formatDate(app.interview_date)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline Health Guidance */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9D4EDD]">
              <Rocket className="w-4 h-4" />
              <span>Pipeline Health</span>
            </div>
            <div className="p-3 bg-[#161616] border border-[#262626] rounded-xl space-y-1">
              <p className="text-xs font-semibold text-[#FFFFFF]">Keep Applying</p>
              <p className="text-[11px] text-[#888888] leading-relaxed">
                Aim for 5–10 quality applications per week to maintain a steady interview flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}