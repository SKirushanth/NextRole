import { useState } from "react";
import { api } from "../lib/api";
import StatusDropdown from "./StatusDropdown";
import DatePickerPro from "./DatePickerPro";
import { Building2, Briefcase, Link, Plus, Loader2 } from "lucide-react";
import type { ApplicationCreate, ApplicationStatus } from "../types";

export interface ApplicationFormProps {
  onCreated?: () => void;
  onSubmit?: (payload: ApplicationCreate) => void;
}

interface FormState {
  company_name: string;
  job_title: string;
  job_url: string;
  status: ApplicationStatus;
  interview_date: string;
}

export default function ApplicationForm({ onCreated, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormState>({
    company_name: "",
    job_title: "",
    job_url: "",
    status: "APPLIED",
    interview_date: "",
  });
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const payload: ApplicationCreate = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_url: formData.job_url || null,
        status: formData.status,
        interview_date: formData.interview_date ? new Date(formData.interview_date).toISOString() : null,
      };

      await api.createApplication(payload);

      if (onCreated) onCreated();
      if (onSubmit) onSubmit(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create application";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full bg-white border border-black/[0.08] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5 text-zinc-950 font-semibold">
        <Plus className="w-4 h-4 text-indigo-600" />
        <h2 className="text-base tracking-tight">New Application</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Company *</label>
          <div className="relative group">
            <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600 z-10" />
            <input
              type="text"
              name="company_name"
              required
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g. Stripe"
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-zinc-50 border border-black/[0.08] rounded-xl pr-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Job Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Job Title *</label>
          <div className="relative group">
            <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600 z-10" />
            <input
              type="text"
              name="job_title"
              required
              value={formData.job_title}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-zinc-50 border border-black/[0.08] rounded-xl pr-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Job URL Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Job URL</label>
          <div className="relative group">
            <Link className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600 z-10" />
            <input
              type="url"
              name="job_url"
              value={formData.job_url}
              onChange={handleChange}
              placeholder="https://..."
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-zinc-50 border border-black/[0.08] rounded-xl pr-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Status</label>
          <StatusDropdown
            value={formData.status}
            onChange={(newStatus) =>
              setFormData((prev) => ({ ...prev, status: newStatus }))
            }
            theme="light"
          />
        </div>

        {/* Interview Date Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Interview Date</label>
          <DatePickerPro
            value={formData.interview_date ? new Date(formData.interview_date) : null}
            onChange={(date) => {
              if (!date) {
                setFormData((prev) => ({ ...prev, interview_date: "" }));
                return;
              }
              const yr = date.getFullYear();
              const mo = String(date.getMonth() + 1).padStart(2, "0");
              const da = String(date.getDate()).padStart(2, "0");
              const hr = String(date.getHours()).padStart(2, "0");
              const mi = String(date.getMinutes()).padStart(2, "0");
              setFormData((prev) => ({
                ...prev,
                interview_date: `${yr}-${mo}-${da}T${hr}:${mi}`,
              }));
            }}
            placeholder="dd/mm/yyyy --:--"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save application</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
