import { Briefcase, KanbanSquare, LayoutGrid, LogOut } from "lucide-react";
import type { UserResponse } from "../types";

export interface SidebarProps {
  user: UserResponse | null;
  onLogout: () => void;
  activeTab?: string;
  onNavigate: (tab: "Dashboard" | "Applications") => void;
}

export default function Sidebar({
  user,
  onLogout,
  activeTab = "Dashboard",
  onNavigate,
}: SidebarProps) {
  const isDashboard = activeTab === "Dashboard";

  return (
    <aside className="w-64 min-h-screen h-screen bg-[#FBFBFC] text-zinc-950 flex flex-col justify-between p-3.5 shrink-0 border-r border-black/[0.07] sticky top-0">
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[14px] tracking-tight">NextRole</span>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-600 tracking-wide">
            PRO
          </span>
        </div>

        <div className="px-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Workspace
          </span>
        </div>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate("Dashboard")}
            className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
              isDashboard
                ? "bg-white text-zinc-950 border border-black/[0.08] shadow-sm"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
            }`}
          >
            {isDashboard && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-indigo-600" />
            )}
            <LayoutGrid className="w-4 h-4" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate("Applications")}
            className={`relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
              !isDashboard
                ? "bg-white text-zinc-950 border border-black/[0.08] shadow-sm"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
            }`}
          >
            {!isDashboard && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-indigo-600" />
            )}
            <span className="flex items-center gap-2.5">
              <KanbanSquare className="w-4 h-4" />
              Applications
            </span>
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-black/[0.06] mt-6">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.07] shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {(user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-[12px] font-semibold text-zinc-950 leading-tight truncate capitalize">
                {user?.email ? user.email.split("@")[0] : "User"}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {user?.email || "test@gmail.com"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
