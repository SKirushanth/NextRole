import { useState } from "react";
import { api } from "../lib/api.js";
import { Building2, Briefcase, Link, Calendar, Plus, Loader2 } from "lucide-react";

export default function ApplicationForm({ onCreated, onSubmit }) {
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    status: "APPLIED",
    interview_date: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // Map datetime string or pass null if empty
      const payload = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_url: formData.job_url || null,
        status: formData.status,
        interview_date: formData.interview_date ? new Date(formData.interview_date).toISOString() : null,
      };

      await api.createApplication(payload);

      if (onCreated) onCreated();
      if (onSubmit) onSubmit(payload);
    } catch (err) {
      setError(err.message || "Failed to create application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full bg-[#121212] border border-[#262626] rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-white font-medium">
        <Plus className="w-4 h-4 text-[#888888]" />
        <h2>New Application</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg text-xs text-[#F87171]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Company Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#888888]">Company *</label>
          <div className="relative group">
            <Building2 className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#9D4EDD] group-focus-within:text-[#9D4EDD] group-focus-within:animate-pulse z-10" />
            <input
              type="text"
              name="company_name"
              required
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g. Stripe"
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20"
            />
          </div>
        </div>

        {/* Job Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#888888]">Job Title *</label>
          <div className="relative group">
            <Briefcase className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#9D4EDD] group-focus-within:text-[#9D4EDD] group-focus-within:animate-pulse z-10" />
            <input
              type="text"
              name="job_title"
              required
              value={formData.job_title}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20"
            />
          </div>
        </div>

        {/* Job URL Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#888888]">Job URL</label>
          <div className="relative group">
            <Link className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#9D4EDD] group-focus-within:text-[#9D4EDD] group-focus-within:animate-pulse z-10" />
            <input
              type="url"
              name="job_url"
              value={formData.job_url}
              onChange={handleChange}
              placeholder="https://..."
              style={{ paddingLeft: "2.5rem" }}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20"
            />
          </div>
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#888888]">Status</label>
          <div className="relative group">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20 cursor-pointer"
            >
              <option value="APPLIED">APPLIED</option>
              <option value="INTERVIEWING">INTERVIEWING</option>
              <option value="OFFER">OFFER</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Interview Date Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#888888]">Interview Date</label>
          <div className="relative group">
            <Calendar className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 group-hover:text-[#9D4EDD] group-focus-within:text-[#9D4EDD] group-focus-within:animate-pulse z-10" />
            <input
              type="text"
              name="interview_date"
              value={formData.interview_date}
              onChange={handleChange}
              onFocus={(e) => (e.target.type = "datetime-local")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              placeholder="Select date & time..."
              style={{ paddingLeft: "2.5rem", colorScheme: "dark" }}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9D4EDD]/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-transform duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
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

