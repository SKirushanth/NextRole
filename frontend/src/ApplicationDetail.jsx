import { useState } from "react";
import { api, STATUSES } from "./api.js";
import { fromLocalInput, toLocalInput } from "./dates.js";

// Render with key={application.id} so the fields reset when a different card is opened.
export default function ApplicationDetail({ application, onClose, onChanged }) {
  const original = {
    status: application.status,
    notes: application.notes || "",
    interviewDate: toLocalInput(application.interview_date),
  };

  const [status, setStatus] = useState(original.status);
  const [notes, setNotes] = useState(original.notes);
  const [interviewDate, setInterviewDate] = useState(original.interviewDate);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const dirty =
    status !== original.status ||
    notes !== original.notes ||
    interviewDate !== original.interviewDate;

  async function save() {
    // Only send what changed. The backend resets the reminder whenever interview_date is sent.
    const changes = {};
    if (status !== original.status) changes.status = status;
    if (notes !== original.notes) changes.notes = notes;
    if (interviewDate !== original.interviewDate) {
      changes.interview_date = fromLocalInput(interviewDate);
    }
    setError("");
    setBusy(true);
    try {
      await api.updateApplication(application.id, changes);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${application.company_name} – ${application.job_title}?`)) return;
    try {
      await api.deleteApplication(application.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="panel" aria-label="Application details">
      <button className="ghost close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <h2>{application.company_name}</h2>
      <p>{application.job_title}</p>
      {application.job_url && (
        <p>
          <a href={application.job_url} target="_blank" rel="noreferrer">
            Job posting
          </a>
        </p>
      )}

      <label className="field">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="field">
        Interview date (a reminder email is sent within 24 hours of it)
        <div className="row">
          <input
            type="datetime-local"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
          />
          {interviewDate && (
            <button type="button" className="ghost" onClick={() => setInterviewDate("")}>
              Clear
            </button>
          )}
        </div>
      </label>

      <label className="field">
        Notes
        <textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}
      <button onClick={save} disabled={!dirty || busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
      <button className="danger" onClick={remove}>
        Delete application
      </button>
    </aside>
  );
}