import { useCallback, useEffect, useRef, useState } from "react";
import { api, STATUSES } from "./api.js";
import { formatDate } from "./dates.js";
import ApplicationForm from "./ApplicationForm.jsx";
import ApplicationDetail from "./ApplicationDetail.jsx";
import SpecularButton from "./SpecularButton.jsx";
import {
  Search,
  Plus,
  ExternalLink,
  Calendar,
  ChevronDown,
  Building2,
  X,
  Loader2
} from "lucide-react";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const METRIC_COLORS = {
  APPLIED: "#4ADE80",       // Muted mint green
  INTERVIEWING: "#60A5FA",  // Soft blue
  OFFER: "#A78BFA",        // Gentle purple
  REJECTED: "#F87171",     // Dusty rose
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

  // Debounce API call on search input
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function move(app, status) {
    if (app.status === status) return;
    // Optimistic local state update
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
    <div className="space-y-4">
      {/* Search Bar & New Application Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative group w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#9D4EDD] group-focus-within:text-[#9D4EDD] group-focus-within:animate-pulse z-10" />
          <input
            type="text"
            placeholder="Search company or job title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
            className="w-full bg-[#121212] border border-[#262626] rounded-xl pr-4 py-2.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20"
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

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl text-xs text-[#F87171]">
          {error}
        </div>
      )}

      {/* Application Creation Form Modal Overlay */}
      {showForm && (
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 transition-all">
          <ApplicationForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Top 4 Summary Metric Bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUSES.map((status) => {
          const label = LABELS[status] || status;
          const count = apps.filter((a) => a.status === status).length;
          const percentage = totalAppsCount > 0 ? Math.round((count / totalAppsCount) * 100) : 0;
          const color = METRIC_COLORS[status] || "#FFFFFF";

          return (
            <div
              key={status}
              className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 space-y-1.5"
            >
              <div className="flex justify-between items-center text-xs font-medium text-[#888888]">
                <span>{label}</span>
                <span style={{ color }}>{percentage}%</span>
              </div>
              <div className="text-xl font-bold text-[#FFFFFF] tracking-tight">{count}</div>
              <div className="h-1 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#888888] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
          <span className="text-xs font-mono">Loading applications…</span>
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

            return (
              <section
                key={status}
                className={`bg-[#121212] border rounded-xl p-3.5 lg:h-[calc(100vh-270px)] lg:min-h-[380px] min-h-[320px] flex flex-col transition-colors ${
                  isOver ? "border-[#9D4EDD]/50 bg-[#141414]" : "border-[#262626]"
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
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">
                    {LABELS[status] || status}
                  </h3>
                  <span className="text-xs font-mono text-[#888888] bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-[#262626]">
                    {items.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 custom-scrollbar">
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
                        className={`bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-3 cursor-grab active:cursor-grabbing hover:border-[#3A3A3A] transition-all ${
                          isDragging ? "opacity-40 scale-95 border-dashed border-[#666666]" : ""
                        }`}
                      >
                        {/* Company Name & Drag Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-semibold text-[#FFFFFF] text-sm min-w-0">
                            <Building2 className="w-4 h-4 text-[#888888] shrink-0" />
                            <span className="truncate">{a.company_name}</span>
                          </div>
                          <span
                            className="text-[#666666] hover:text-[#FFFFFF] cursor-grab text-xs font-mono select-none"
                            title="Drag to move"
                          >
                            ⋮⋮
                          </span>
                        </div>

                        {/* Job Title */}
                        <p className="text-xs text-[#888888] font-medium truncate">
                          {a.job_title}
                        </p>

                        {/* Job Posting URL */}
                        {jobUrl && (
                          <a
                            href={jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#FFFFFF] transition-colors max-w-full"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Job posting</span>
                          </a>
                        )}

                        {/* Interview Date */}
                        {a.interview_date && (
                          <div className="flex items-center gap-1.5 text-xs text-[#4ADE80] font-medium bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-md px-2 py-1 w-fit">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatDate(a.interview_date)}</span>
                          </div>
                        )}

                        {/* Status Selector */}
                        <div className="relative pt-1">
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
                            className="w-full bg-[#101010] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-[#FFFFFF] appearance-none focus:outline-none focus:border-[#444444] cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {LABELS[s] || s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-[#888888] absolute right-2.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none" />
                        </div>
                      </article>
                    );
                  })}

                  {/* Empty state active only while dragging */}
                  {items.length === 0 && draggedApp && (
                    <div className="h-24 border border-dashed border-[#9D4EDD]/40 bg-[#9D4EDD]/5 rounded-xl flex items-center justify-center text-xs text-[#9D4EDD] select-none">
                      Drop here to move
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Selected Application Detail Drawer/Modal */}
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