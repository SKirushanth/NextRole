import { useCallback, useEffect, useRef, useState } from "react";
import { api, STATUSES } from "../lib/api";
import { formatDate } from "../lib/dates";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationDetail from "../components/ApplicationDetail";
import SpecularButton from "../components/SpecularButton";
import StatusDropdown from "../components/StatusDropdown";
import {
  Search,
  Plus,
  ExternalLink,
  Calendar,
  Building2,
  X,
  Loader2,
  GripVertical,
} from "lucide-react";
import type { ApplicationResponse, ApplicationStatus } from "../types";

const LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

interface MetricTheme {
  color: string;
  bgAlpha: string;
  borderAlpha: string;
  glow: string;
}

const METRIC_THEMES: Record<ApplicationStatus, MetricTheme> = {
  APPLIED: {
    color: "#0284c7",
    bgAlpha: "rgba(14, 165, 233, 0.08)",
    borderAlpha: "rgba(14, 165, 233, 0.20)",
    glow: "rgba(14, 165, 233, 0.10)",
  },
  INTERVIEWING: {
    color: "#4f46e5",
    bgAlpha: "rgba(99, 102, 241, 0.08)",
    borderAlpha: "rgba(99, 102, 241, 0.20)",
    glow: "rgba(99, 102, 241, 0.10)",
  },
  OFFER: {
    color: "#059669",
    bgAlpha: "rgba(16, 185, 129, 0.08)",
    borderAlpha: "rgba(16, 185, 129, 0.20)",
    glow: "rgba(16, 185, 129, 0.10)",
  },
  REJECTED: {
    color: "#e11d48",
    bgAlpha: "rgba(244, 63, 94, 0.08)",
    borderAlpha: "rgba(244, 63, 94, 0.20)",
    glow: "rgba(244, 63, 94, 0.10)",
  },
};

export default function Board() {
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedOriginRect, setSelectedOriginRect] = useState<DOMRect | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [draggedApp, setDraggedApp] = useState<ApplicationResponse | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const load = useCallback(async () => {
    try {
      setApps(await api.listApplications({ q: search.trim() || undefined }));
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function move(app: ApplicationResponse, status: ApplicationStatus) {
    if (app.status === status) return;
    setApps((current) =>
      current.map((a) => (a.id === app.id ? { ...a, status } : a))
    );
    try {
      await api.updateApplication(app.id, { status });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      load();
    }
  }

  function handleDragStart(e: React.DragEvent, app: ApplicationResponse) {
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

  function handleDragOver(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLElement>, status: ApplicationStatus) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverColumn === status) {
        setDragOverColumn(null);
      }
    }
  }

  function handleDrop(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    setDragOverColumn(null);
    let appToMove = draggedApp;
    if (!appToMove) {
      const idStr = e.dataTransfer.getData("text/plain");
      if (idStr) {
        appToMove = apps.find((a) => String(a.id) === idStr) || null;
      }
    }
    if (appToMove && appToMove.status !== status) {
      move(appToMove, status);
    }
    setDraggedApp(null);
  }

  function handleCardClick(appId: number, card: HTMLElement) {
    if (isDraggingRef.current) return;
    setSelectedId(appId);
    setSelectedOriginRect(card.getBoundingClientRect());
  }

  const selected = apps.find((a) => a.id === selectedId) || null;
  const totalAppsCount = apps.length;

  return (
    <div className="space-y-6">
      {/* Search Bar & Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="relative group w-full sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600 z-10" />
          <input
            type="text"
            placeholder="Search company or job title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
            className="w-full bg-white border border-black/[0.08] rounded-xl pr-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />
        </div>

        <SpecularButton
          onClick={() => setShowForm((s) => !s)}
          size="md"
          radius={12}
          tint="#ffffff"
          textColor="#18181b"
          className="border border-black/[0.08] shadow-xs hover:shadow-sm"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Close form</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>New application</span>
            </>
          )}
        </SpecularButton>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* New Application Form Container */}
      {showForm && (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] hover:border-indigo-300/70 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.10),0_4px_12px_rgba(0,0,0,0.02)]">
          <ApplicationForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Metric Cards (White Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STATUSES.map((status) => {
          const label = LABELS[status] || status;
          const count = apps.filter((a) => a.status === status).length;
          const percentage = totalAppsCount > 0 ? Math.round((count / totalAppsCount) * 100) : 0;
          const theme = METRIC_THEMES[status] || METRIC_THEMES.APPLIED;

          return (
            <div
              key={status}
              className="relative overflow-hidden bg-white border border-black/[0.07] hover:border-black/[0.14] rounded-xl p-4 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-sm"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ backgroundColor: theme.color }}
              />

              <div className="flex justify-between items-center text-xs font-medium text-zinc-500 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="font-medium text-zinc-600">{label}</span>
                </div>
                <span
                  className="tabular-nums font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md border"
                  style={{
                    color: theme.color,
                    backgroundColor: theme.bgAlpha,
                    borderColor: theme.borderAlpha,
                  }}
                >
                  {percentage}%
                </span>
              </div>

              <div className="text-2xl font-bold text-zinc-950 tracking-tight mb-3">
                {count}
              </div>

              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
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

      {/* Kanban Board Columns (White / Light Theme) */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm font-mono">Loading applications…</span>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
                className={`bg-zinc-100/70 border rounded-2xl p-3.5 lg:h-[calc(100vh-250px)] lg:min-h-[420px] min-h-[300px] flex flex-col transition-all duration-200 ${
                  isOver
                    ? "border-indigo-400 bg-indigo-50/40 shadow-xs"
                    : "border-black/[0.06]"
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
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/[0.06] shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                      {LABELS[status] || status}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-600 bg-white px-2.5 py-0.5 rounded-full border border-black/[0.06] shadow-2xs">
                    {items.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-0 custom-scrollbar">
                  {items.map((a) => {
                    const isDragging = draggedApp?.id === a.id;
                    const isSelected = selectedId === a.id;
                    const jobUrl = a.job_url || a.url;

                    return (
                      <article
                        key={a.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, a)}
                        onDragEnd={handleDragEnd}
                        onClick={(event) => handleCardClick(a.id, event.currentTarget)}
                        className={`group relative bg-white border border-black/[0.08] hover:border-black/[0.16] rounded-xl p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 shadow-xs hover:shadow-md ${
                          isDragging
                            ? "opacity-30 scale-95 border-dashed border-indigo-500"
                            : isSelected
                              ? "ring-2 ring-indigo-500/40 scale-[0.99]"
                              : ""
                        }`}
                      >
                        {/* Company & Drag handle */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 font-semibold text-zinc-950 text-sm min-w-0 flex-1">
                            <div className="p-1.5 bg-zinc-100 rounded-lg border border-black/[0.06] text-zinc-700 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                            <span
                              className="truncate tracking-tight block w-full min-w-0 text-zinc-900 font-semibold"
                              title={a.company_name}
                            >
                              {a.company_name}
                            </span>
                          </div>
                          <GripVertical className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0 cursor-grab" />
                        </div>

                        {/* Job Title */}
                        <p
                          className="text-xs text-zinc-600 font-medium truncate leading-tight pl-0.5 block w-full min-w-0"
                          title={a.job_title}
                        >
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
                              className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 transition-colors truncate min-w-0"
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

                        {/* Quick Status Dropdown (Light Theme) */}
                        <div className="pt-1 border-t border-black/[0.06]">
                          <StatusDropdown
                            value={a.status}
                            onChange={(newStatus) => move(a, newStatus)}
                            theme="light"
                            className="board-card-status"
                          />
                        </div>
                      </article>
                    );
                  })}

                  {/* Active Drop Placeholder */}
                  {items.length === 0 && draggedApp && (
                    <div className="h-20 border border-dashed border-indigo-400 bg-indigo-50/50 rounded-xl flex items-center justify-center text-xs font-semibold text-indigo-600 select-none">
                      Drop here
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Application Detail Modal */}
      {selected && (
        <ApplicationDetail
          key={selected.id}
          application={selected}
          originRect={selectedOriginRect}
          onClose={() => {
            setSelectedId(null);
            setSelectedOriginRect(null);
          }}
          onChanged={load}
        />
      )}
    </div>
  );
}
