import { useState } from "react";
import { api, STATUSES } from "./api.js";
import { fromLocalInput, toLocalInput } from "./dates.js";
import {
  X,
  ExternalLink,
  Trash2,
  Building2,
  Calendar,
  Save,
  Loader2,
  FileText,
  ChevronDown
} from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex justify-end transition-all">
      <aside
        className="w-full max-w-md bg-[#121212] border-l border-[#262626] h-full p-6 overflow-y-auto flex flex-col justify-between space-y-6 shadow-2xl selection:bg-[#262626] selection:text-[#FFFFFF]"
        aria-label="Application details"
      >
        <div className="space-y-6">
          {/* Header & Close Button */}
          <div className="flex items-start justify-between border-b border-[#262626] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#888888]" />
                <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
                  {application.company_name}
                </h2>
              </div>
              <p className="text-xs text-[#888888] font-medium">{application.job_title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Job Posting Link */}
          {(application.job_url || application.url) && (
            <a
              href={application.job_url || application.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors bg-[#60A5FA]/10 border border-[#60A5FA]/20 px-3 py-1.5 rounded-lg w-fit"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View job posting</span>
            </a>
          )}

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#888888]">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#161616] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FFFFFF] appearance-none focus:outline-none focus:border-[#444444] transition-colors cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Interview Date & Reminder Info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#888888] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                <span>Interview Date</span>
              </label>
              {interviewDate && (
                <button
                  type="button"
                  onClick={() => setInterviewDate("")}
                  className="text-[11px] text-[#888888] hover:text-[#FFFFFF] transition-colors"
                >
                  Clear date
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#444444] transition-colors"
            />
            <p className="text-[11px] text-[#666666]">
              A reminder email will automatically be scheduled prior to the interview.
            </p>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#888888] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#888888]" />
              <span>Notes</span>
            </label>
            <textarea
              rows={7}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key contact details, interview preparation notes, salary info..."
              className="w-full bg-[#161616] border border-[#262626] rounded-lg p-3 text-xs text-[#FFFFFF] placeholder-[#555555] focus:outline-none focus:border-[#444444] transition-colors resize-y"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg text-xs text-[#F87171]">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#262626] flex items-center justify-between gap-3">
          <button
            onClick={remove}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[#F87171] hover:text-[#EF4444] bg-[#F87171]/10 hover:bg-[#F87171]/20 rounded-lg transition-colors border border-[#F87171]/20 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={save}
            disabled={!dirty || busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#000000] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{busy ? "Saving…" : "Save changes"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}