import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./lib/api.js";
import Login from "./pages/Login.jsx";
import Board from "./pages/Board.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import StrokeText from "./components/StrokeText.jsx";
import { LogOut, Loader2, Home, Briefcase } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [activeTab, setActiveTab] = useState("home"); // 'home' | 'applications'

  // Restore the session if a token is stored
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // Event listener when token expires
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("nextrole:logout", onLogout);
    return () => window.removeEventListener("nextrole:logout", onLogout);
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-[#888888] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
        <span className="text-xs font-mono">Loading session…</span>
      </div>
    );
  }

  if (!user) return <Login onLoggedIn={setUser} />;

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#FFFFFF] font-sans antialiased selection:bg-[#262626] selection:text-[#FFFFFF]">
      {/* Dark Sidebar Navigation */}
      <aside className="w-64 border-r border-[#262626] bg-[#0A0A0A] p-5 flex flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-1">
            <StrokeText
              text="NextRole"
              fontSize={22}
              strokeColor="#888888"
              fillColor="#FFFFFF"
              strokeWidth={1.2}
            />
          </div>

          {/* Navigation Controls */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#888888] hover:bg-[#121212] hover:text-[#FFFFFF]"
              }`}
            >
              <Home className="w-4 h-4 text-[#9D4EDD]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab("applications")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === "applications"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#888888] hover:bg-[#121212] hover:text-[#FFFFFF]"
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#9D4EDD]" />
              <span>Applications</span>
            </button>
          </nav>
        </div>

        {/* User Session Info & Logout */}
        <div className="pt-4 border-t border-[#262626] space-y-3">
          <span className="text-xs text-[#888888] font-mono block truncate" title={user.email}>
            {user.email}
          </span>
          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 text-xs text-[#888888] hover:text-[#FFFFFF] py-2 px-3 rounded-lg border border-[#262626] bg-[#121212] hover:border-[#444444] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 p-6">
        {activeTab === "home" ? (
          <DashboardHome user={user} onNavigateToApps={() => setActiveTab("applications")} />
        ) : (
          <Board />
        )}
      </main>
    </div>
  );
}