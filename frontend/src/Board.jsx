import { useCallback, useEffect, useRef, useState } from "react";
import { api, STATUSES } from "./api.js";
import { formatDate } from "./dates.js";
import ApplicationForm from "./ApplicationForm.jsx";
import ApplicationDetail from "./ApplicationDetail.jsx";

const LABELS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
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

  // Debounce so we don't call the API on every keystroke
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function move(app, status) {
    if (app.status === status) return;
    // Optimistically update the status in local state for instantaneous UI feedback
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

  return (
    <main>
      <div className="toolbar">
        <input
          placeholder="Search company or job title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close form" : "+ New application"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <ApplicationForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div
          className="columns"
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
                className={`column ${isOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverColumn(status);
                }}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="column-header">
                  <h3>
                    {LABELS[status]} <span className="badge">{items.length}</span>
                  </h3>
                </div>
                <div className="column-items">
                  {items.map((a) => {
                    const isDragging = draggedApp?.id === a.id;
                    return (
                      <article
                        key={a.id}
                        className={`card item ${isDragging ? "dragging" : ""}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, a)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleCardClick(a.id)}
                      >
                        <div className="item-header">
                          <strong>{a.company_name}</strong>
                          <span className="drag-handle" title="Drag to move" aria-hidden="true">
                            ⋮⋮
                          </span>
                        </div>
                        <span>{a.job_title}</span>
                        {a.interview_date && (
                          <span className="badge interview">
                            Interview {formatDate(a.interview_date)}
                          </span>
                        )}
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
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </article>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="column-empty">
                      {draggedApp ? "Drop here to move" : "No applications"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selected && (
        <ApplicationDetail
          key={selected.id}
          application={selected}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </main>
  );
}