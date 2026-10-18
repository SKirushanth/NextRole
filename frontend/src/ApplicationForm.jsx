import { useState } from "react";
import { api, STATUSES } from "./api.js";
import { fromLocalInput } from "./dates.js";

const empty = {
  company_name: "",
  job_title: "",
  job_url: "",
  status: "APPLIED",
  interview_date: "",
};

export default function ApplicationForm({ onCreated }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        job_title: form.job_title.trim(),
        status: form.status,
      };
      if (form.job_url.trim()) payload.job_url = form.job_url.trim();
      if (form.interview_date) payload.interview_date = fromLocalInput(form.interview_date);
      await api.createApplication(payload);
      setForm(empty);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <label className="field">
        Company *
        <input value={form.company_name} onChange={set("company_name")} required />
      </label>
      <label className="field">
        Job title *
        <input value={form.job_title} onChange={set("job_title")} required />
      </label>
      <label className="field">
        Job URL
        <input type="url" value={form.job_url} onChange={set("job_url")} placeholder="https://" />
      </label>
      <label className="field">
        Status
        <select value={form.status} onChange={set("status")}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Interview date
        <input type="datetime-local" value={form.interview_date} onChange={set("interview_date")} />
      </label>
      <button disabled={busy}>{busy ? "Saving…" : "Save application"}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}