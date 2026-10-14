import { useCallback, useEffect, useState } from "react";
import { api, STATUSES } from "./api.js";
import { formatDate } from "./dates.js";
import ApplicationForm from "./ApplicationForm.jsx";
import ApplicationDetail from "./ApplicationDetail.jsx";
import {
  Search,
  Plus,
  ExternalLink,
  Calendar,
  ChevronDown,
  Building2,
  X,
  Loader2,
  GripVertical,
  LayoutGrid,
  List,
  Filter
} from "lucide-react";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_THEMES = {
  APPLIED: { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
  INTERVIEWING: { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  OFFER: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)" },
  REJECTED: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
};

export default function ApplicationsPage({ onSelectApp }) {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("board"); // 'board' or 'list'
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setApps(await api.listApplications({ q: search.trim() || undefined }));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleMove(app, newStatus) {
    if (app.status === newStatus) return;
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
    );
    try {
      await api.updateApplication(app.id, { status: newStatus });
      load();
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const filteredApps = apps.filter(
    (a) => statusFilter === "ALL" || a.status === statusFilter
  );

  const selected = apps.find((a) => a.id === selectedId) || null;

  return (
    <div className="p-8 space-y-6 bg-[#070D18] min-h-screen text-white">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-xs text-[#8A99AD] mt-0.5">
            Manage and track all your job opportunities in one place.
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#2563EB]/20 cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? "Close Form" : "New Application"}</span>
        </button>
      </div>

      {/* Slide-down Application Form */}
      {showForm && (
        <div className="bg-[#0D1829] border border-[#1E2D42] rounded-2xl p-6 shadow-2xl">
          <ApplicationForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0D1829] border border-[#1E2D42] p-3 rounded-2xl">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111C2E] border border-[#1E2D42] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-[#111C2E] border border-[#1E2D42] rounded-xl px-3 py-1.5 text-xs text-[#8A99AD]">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#0D1829]">
                  {LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle (Grid / List) */}
          <div className="flex items-center bg-[#111C2E] border border-[#1E2D42] rounded-xl p-1">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "board"
                  ? "bg-[#2563EB] text-white"
                  : "text-[#64748B] hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-[#2563EB] text-white"
                  : "text-[#64748B] hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Main View Display */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#8A99AD] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span className="text-xs font-mono">Loading applications…</span>
        </div>
      ) : viewMode === "board" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const items = filteredApps.filter((a) => a.status === status);
            const theme = STATUS_THEMES[status] || STATUS_THEMES.APPLIED;

            return (
              <section
                key={status}
                className="bg-[#0D1829] border border-[#1E2D42] rounded-2xl p-4 min-h-[420px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2D42]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                    <h3 className="text-sm font-semibold text-white">
                      {LABELS[status] || status}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#8A99AD] bg-[#111C2E] px-2.5 py-0.5 rounded-full border border-[#1E2D42]">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {items.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className="bg-[#111C2E] border border-[#1E2D42] hover:border-[#334155] rounded-xl p-3.5 space-y-2.5 transition-all hover:-translate-y-0.5 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-[#1E2D42] rounded-lg text-[#8A99AD]">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-sm text-white truncate">
                            {app.company_name}
                          </span>
                        </div>
                        <GripVertical className="w-4 h-4 text-[#64748B] group-hover:text-white" />
                      </div>

                      <p className="text-xs text-[#8A99AD] font-medium truncate">
                        {app.job_title}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {app.job_url ? (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#3B82F6] hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        ) : (
                          <span />
                        )}

                        {app.interview_date && (
                          <div
                            className="flex items-center gap-1 font-medium px-2 py-0.5 rounded border text-[10px]"
                            style={{
                              color: theme.color,
                              backgroundColor: theme.bg,
                              borderColor: `${theme.color}40`,
                            }}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(app.interview_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Dropdown Move */}
                      <div className="relative pt-1 border-t border-[#1E2D42]">
                        <select
                          value={app.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleMove(app, e.target.value)}
                          className="w-full bg-[#0D1829] border border-[#1E2D42] rounded-lg px-2.5 py-1 text-[11px] text-[#8A99AD] hover:text-white appearance-none focus:outline-none cursor-pointer"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LABELS[s] || s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Dense List Table View */
        <div className="bg-[#0D1829] border border-[#1E2D42] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-[#8A99AD]">
            <thead className="bg-[#111C2E] border-b border-[#1E2D42] text-white font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Interview Date</th>
                <th className="px-6 py-3.5 text-right">Job Posting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D42]">
              {filteredApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className="hover:bg-[#111C2E] transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-semibold text-white">
                    {app.company_name}
                  </td>
                  <td className="px-6 py-4 text-white">{app.job_title}</td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        color: STATUS_THEMES[app.status]?.color,
                        backgroundColor: STATUS_THEMES[app.status]?.bg,
                      }}
                    >
                      ● {LABELS[app.status] || app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.interview_date ? formatDate(app.interview_date) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.job_url ? (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#3B82F6] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selected && (
        <ApplicationDetail
          key={selected.id}
          application={selected}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}