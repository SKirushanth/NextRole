import { useCallback, useEffect, useState } from "react";
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
    try {
      await api.updateApplication(app.id, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
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
        <div className="columns">
          {STATUSES.map((status) => {
            const items = apps.filter((a) => a.status === status);
            return (
              <section key={status} className="column">
                <h3>
                  {LABELS[status]} <span className="badge">{items.length}</span>
                </h3>
                {items.map((a) => (
                  <article key={a.id} className="card item" onClick={() => setSelectedId(a.id)}>
                    <strong>{a.company_name}</strong>
                    <span>{a.job_title}</span>
                    {a.interview_date && (
                      <span className="badge interview">Interview {formatDate(a.interview_date)}</span>
                    )}
                    <select
                      value={a.status}
                      aria-label={`Move ${a.company_name}`}
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
                ))}
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