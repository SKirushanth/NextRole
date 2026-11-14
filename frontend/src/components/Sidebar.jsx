import { Briefcase, KanbanSquare, LayoutGrid, LogOut } from "lucide-react";

export default function Sidebar({ user, onLogout, activeTab = "Dashboard", onNavigate }) {
  const isDashboard = activeTab === "Dashboard";

  return (
    <aside className="w-64 min-h-screen h-screen bg-[#FAFAFA] text-zinc-950 flex flex-col justify-between p-4 shrink-0 border-r border-zinc-200/80 sticky top-0">
      <div>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">NextRole</span>
        </div>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate("Dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isDashboard
                ? "bg-white text-zinc-950 border border-zinc-200/90 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 border border-transparent"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate("Applications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              !isDashboard
                ? "bg-white text-zinc-950 border border-zinc-200/90 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 border border-transparent"
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            Applications
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-zinc-200/80 mt-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col min-w-0 pr-2">
            <p className="text-[13px] font-medium text-zinc-900 truncate capitalize">
              {user?.email ? user.email.split("@")[0] : "User"}
            </p>
            <p className="text-[11px] text-zinc-500 truncate">
              {user?.email || "test@gmail.com"}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-md transition-colors shrink-0 cursor-pointer"
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
