import { Briefcase, KanbanSquare, LayoutGrid, LogOut } from "lucide-react";

export default function Sidebar({ user, onLogout, activeTab = "Dashboard", onNavigate }) {
  const isDashboard = activeTab === "Dashboard";

  return (
    <aside className="w-64 min-h-screen h-screen bg-[#1C1C1E] text-white flex flex-col justify-between p-6 shrink-0 border-r border-zinc-800 sticky top-0">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Briefcase className="w-4 h-4 text-[#1C1C1E]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">NextRole</span>
        </div>

        <nav className="space-y-1.5">
          <button
            type="button"
            onClick={() => onNavigate("Dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isDashboard
                ? "bg-zinc-800 text-white shadow-inner border border-zinc-700/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-zinc-800/40 border border-transparent"
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
                ? "bg-zinc-800 text-white shadow-inner border border-zinc-700/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-zinc-800/40 border border-transparent"
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            Applications
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-zinc-800/80 mt-auto">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col min-w-0 pr-2">
            <p className="text-sm font-semibold text-white truncate capitalize">
              {user?.email ? user.email.split("@")[0] : "User"}
            </p>
            <p className="text-xs text-gray-300 truncate">
              {user?.email || "test@gmail.com"}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors shrink-0 cursor-pointer"
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
