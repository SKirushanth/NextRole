import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { fromLocalInput, toLocalInput } from "../lib/dates";
import StatusDropdown from "./StatusDropdown";
import DatePickerPro from "./DatePickerPro";
import {
  X,
  ExternalLink,
  Trash2,
  Building2,
  Calendar,
  Save,
  Loader2,
  FileText,
} from "lucide-react";
import type { ApplicationResponse, ApplicationStatus, ApplicationUpdate } from "../types";

export interface ApplicationDetailProps {
  application: ApplicationResponse;
  originRect?: DOMRect | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function ApplicationDetail({
  application,
  originRect,
  onClose,
  onChanged,
}: ApplicationDetailProps) {
  const original = {
    status: application.status,
    notes: application.notes || "",
    interviewDate: toLocalInput(application.interview_date),
  };

  const [status, setStatus] = useState<ApplicationStatus>(original.status);
  const [notes, setNotes] = useState<string>(original.notes);
  const [interviewDate, setInterviewDate] = useState<string>(original.interviewDate);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);
  const isClosingRef = useRef<boolean>(false);

  const dirty =
    status !== original.status ||
    notes !== original.notes ||
    interviewDate !== original.interviewDate;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 240);
  }

  async function save() {
    const changes: ApplicationUpdate = {};
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${application.company_name} – ${application.job_title}?`)) return;
    try {
      await api.deleteApplication(application.id);
      onChanged();
      close();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete application");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        onClick={close}
        className={`fixed inset-0 h-screen w-screen bg-zinc-950/25 backdrop-blur-sm ${
          isClosing ? "animate-detail-backdrop-out" : "animate-detail-backdrop-in"
        }`}
      />
      <div
        style={
          originRect
            ? {
                transformOrigin: `${originRect.left + originRect.width / 2}px ${
                  originRect.top + originRect.height / 2
                }px`,
              }
            : undefined
        }
        onClick={(event) => event.stopPropagation()}
        className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-between space-y-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_32px_80px_-16px_rgba(9,9,11,0.28)] selection:bg-zinc-200 selection:text-zinc-950 ${
          isClosing ? "animate-detail-collapse" : "animate-detail-expand"
        }`}
        aria-label="Application details"
      >
        <div className="space-y-6">
          {/* Header & Close Button */}
          <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                  {application.company_name}
                </h2>
              </div>
              <p className="text-xs font-medium text-zinc-500">{application.job_title}</p>
            </div>
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Job Posting Link */}
          {(application.job_url || application.url) && (
            <a
              href={(application.job_url || application.url) ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-600 transition-colors hover:text-sky-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View job posting</span>
            </a>
          )}

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Status</label>
            <StatusDropdown
              value={status}
              onChange={setStatus}
              theme="light"
            />
          </div>

          {/* Interview Date & Reminder Info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                <Calendar className="h-4 w-4 text-[#6B7280]" />
                <span>Interview Date</span>
              </label>
              {interviewDate && (
                <button
                  type="button"
                  onClick={() => setInterviewDate("")}
                  className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-950 cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </div>
            <DatePickerPro
              value={interviewDate ? new Date(interviewDate) : null}
              onChange={(date) => {
                if (!date) {
                  setInterviewDate("");
                  return;
                }
                const yr = date.getFullYear();
                const mo = String(date.getMonth() + 1).padStart(2, "0");
                const da = String(date.getDate()).padStart(2, "0");
                const hr = String(date.getHours()).padStart(2, "0");
                const mi = String(date.getMinutes()).padStart(2, "0");
                setInterviewDate(`${yr}-${mo}-${da}T${hr}:${mi}`);
              }}
              placeholder="Pick a date"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              A reminder email will automatically be scheduled prior to the interview.
            </p>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>Notes</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key contact details, interview preparation notes, salary info..."
              className="min-h-[84px] w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-950 placeholder:text-zinc-400 transition-colors focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <button
            onClick={remove}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={save}
            disabled={!dirty || busy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all shadow-sm ${
              dirty && !busy
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 cursor-pointer active:scale-95"
                : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
            }`}
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{busy ? "Saving…" : "Save changes"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
