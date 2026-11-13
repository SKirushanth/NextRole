import { useCallback, useEffect, useRef, useState } from "react";
import { api, STATUSES } from "../lib/api.js";
import { formatDate } from "../lib/dates.js";
import ApplicationForm from "../components/ApplicationForm.jsx";
import ApplicationDetail from "../components/ApplicationDetail.jsx";
import SpecularButton from "../components/SpecularButton.jsx";
import {
  Search,
  Plus,
  ExternalLink,
  Calendar,
  ChevronDown,
  Building2,
  X,
  Loader2,
  GripVertical
} from "lucide-react";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const METRIC_THEMES = {
  APPLIED: {
    color: "#22C55E",
    bgAlpha: "rgba(34, 197, 94, 0.12)",
    borderAlpha: "rgba(34, 197, 94, 0.25)",
    glow: "rgba(34, 197, 94, 0.15)",
  },
  INTERVIEWING: {
    color: "#3B82F6",
    bgAlpha: "rgba(59, 130, 246, 0.12)",
    borderAlpha: "rgba(59, 130, 246, 0.25)",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  OFFER: {
    color: "#A855F7",
    bgAlpha: "rgba(168, 85, 247, 0.12)",
    borderAlpha: "rgba(168, 85, 247, 0.25)",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  REJECTED: {
    color: "#EF4444",
    bgAlpha: "rgba(239, 68, 68, 0.12)",
    borderAlpha: "rgba(239, 68, 68, 0.25)",
    glow: "rgba(239, 68, 68, 0.15)",
  },
};

export default function Board() {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedApp, setDraggedApp] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const isDraggingRef = useRef(false);

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

  async function move(app, status) {
    if (app.status === status) return;
    setApps((current) =>
      current.map((a) => (a.id === app.id ? { ...a, status } : a))
    );
    try {
      await api.updateApplication(app.id, { status });
      load();
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  function handleDragStart(e, app) {
    isDraggingRef.current = true;
    setDraggedApp(app);
    e.dataTransfer.setData("text/plain", String(app.id));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggedApp(null);
    setDragOverColumn(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  }

  function handleDragLeave(e, status) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverColumn === status) {
        setDragOverColumn(null);
      }
    }
  }

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOverColumn(null);
    let appToMove = draggedApp;
    if (!appToMove) {
      const idStr = e.dataTransfer.getData("text/plain");
      if (idStr) {
        appToMove = apps.find((a) => String(a.id) === idStr);
      }
    }
    if (appToMove && appToMove.status !== status) {
      move(appToMove, status);
    }
    setDraggedApp(null);
  }

  function handleCardClick(appId) {
    if (isDraggingRef.current) return;
    setSelectedId(appId);
  }

  const selected = apps.find((a) => a.id === selectedId) || null;
  const totalAppsCount = apps.length;

  return (
    <div className="space-y-5">
      {/* Search Bar & Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="relative group w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#A855F7] group-focus-within:text-[#A855F7] z-10" />
          <input
            type="text"
            placeholder="Search company or job title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
            className="w-full bg-[#121212] border border-[#262626] rounded-xl pr-3.5 py-2.5 text-sm text-[#FFFFFF] placeholder-[#525252] focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all duration-300 hover:border-[#333333]"
          />
        </div>

        <SpecularButton
          onClick={() => setShowForm((s) => !s)}
          size="md"
          radius={12}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Close form</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>New application</span>
            </>
          )}
        </SpecularButton>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      {/* New Application Form Modal Overlay */}
      {showForm && (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 transition-all shadow-2xl">
          <ApplicationForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STATUSES.map((status) => {
          const label = LABELS[status] || status;
          const count = apps.filter((a) => a.status === status).length;
          const percentage = totalAppsCount > 0 ? Math.round((count / totalAppsCount) * 100) : 0;
          const theme = METRIC_THEMES[status] || METRIC_THEMES.APPLIED;

          return (
            <div
              key={status}
              className="relative overflow-hidden bg-[#121212] border border-[#262626] hover:border-[#333333] rounded-xl p-3.5 transition-all duration-300"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: theme.color }}
              />

              <div className="flex justify-between items-center text-xs font-medium text-[#A3A3A3] mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span>{label}</span>
                </div>
                <span
                  className="font-mono text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: theme.color,
                    backgroundColor: theme.bgAlpha,
                  }}
                >
                  {percentage}%
                </span>
              </div>

              <div className="text-2xl font-bold text-[#FFFFFF] tracking-tight mb-2.5">
                {count}
              </div>

              <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: theme.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#737373] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
          <span className="text-sm font-mono">Loading applications…</span>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setDragOverColumn(null);
            }
          }}
        >
          {STATUSES.map((status) => {
            const items = apps.filter((a) => a.status === status);
            const isOver = dragOverColumn === status;
            const theme = METRIC_THEMES[status] || METRIC_THEMES.APPLIED;

            return (
              <section
                key={status}
                className={`bg-[#0F0F0F] border rounded-xl p-3.5 lg:h-[calc(100vh-250px)] lg:min-h-[400px] min-h-[300px] flex flex-col transition-all duration-200 ${
                  isOver
                    ? "border-[#A855F7]/60 bg-[#141217]"
                    : "border-[#262626]"
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverColumn(status);
                }}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#262626] shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                    <h3 className="text-sm font-semibold text-[#FFFFFF] tracking-wide">
                      {LABELS[status] || status}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#A3A3A3] bg-[#171717] px-2.5 py-0.5 rounded-full border border-[#262626]">
                    {items.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-0 custom-scrollbar">
                  {items.map((a) => {
                    const isDragging = draggedApp?.id === a.id;
                    const jobUrl = a.job_url || a.url;

                    return (
                      <article
                        key={a.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, a)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleCardClick(a.id)}
                        className={`group relative bg-[#141414] border border-[#262626] hover:border-[#3D3D3D] rounded-xl p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 hover:bg-[#181818] ${
                          isDragging ? "opacity-30 scale-95 border-dashed border-[#A855F7]" : ""
                        }`}
                      >
                        {/* Company & Drag handle */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 font-semibold text-[#FFFFFF] text-sm min-w-0 flex-1">
                            <div className="p-1.5 bg-[#1C1C1C] rounded-md border border-[#2A2A2A] text-[#A3A3A3] shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate tracking-tight block w-full min-w-0" title={a.company_name}>
                              {a.company_name}
                            </span>
                          </div>
                          <GripVertical className="w-4 h-4 text-[#525252] group-hover:text-[#A3A3A3] transition-colors shrink-0 cursor-grab" />
                        </div>

                        {/* Job Title */}
                        <p className="text-xs text-[#A3A3A3] font-medium truncate leading-tight pl-0.5 block w-full min-w-0" title={a.job_title}>
                          {a.job_title}
                        </p>

                        {/* Inline URL & Date Row */}
                        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs min-w-0">
                          {jobUrl ? (
                            <a
                              href={jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-[#737373] hover:text-[#FFFFFF] transition-colors truncate min-w-0"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">Job link</span>
                            </a>
                          ) : (
                            <span />
                          )}

                          {a.interview_date && (
                            <div
                              className="inline-flex items-center gap-1.5 font-medium rounded-md px-2 py-0.5 border shrink-0 text-[11px]"
                              style={{
                                color: theme.color,
                                backgroundColor: theme.bgAlpha,
                                borderColor: theme.borderAlpha,
                              }}
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{formatDate(a.interview_date)}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Dropdown */}
                        <div className="relative pt-1 border-t border-[#1C1C1C]">
                          <select
                            value={a.status}
                            aria-label={`Move ${a.company_name}`}
                            draggable={false}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => move(a, e.target.value)}
                            className="w-full bg-[#181818] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#FFFFFF] appearance-none focus:outline-none focus:border-[#A855F7] transition-all cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {LABELS[s] || s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-[#737373] absolute right-2.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none" />
                        </div>
                      </article>
                    );
                  })}

                  {/* Active Drop Placeholder */}
                  {items.length === 0 && draggedApp && (
                    <div className="h-20 border border-dashed border-[#A855F7]/40 bg-[#A855F7]/5 rounded-lg flex items-center justify-center text-xs font-medium text-[#A855F7] select-none">
                      Drop here
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Application Detail Drawer */}
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

