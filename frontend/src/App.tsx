import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./lib/api";
import Login from "./pages/Login";
import Board from "./pages/Board";
import DashboardHome from "./pages/DashboardHome";
import Sidebar from "./components/Sidebar";
import { Loader2 } from "lucide-react";
import type { UserResponse } from "./types";

export default function App() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(getToken()));
  const [activeTab, setActiveTab] = useState<"Dashboard" | "Applications">("Dashboard");

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
    <div className="flex min-h-screen bg-[#F4F4F5] text-zinc-950 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-700">
      <Sidebar
        user={user}
        onLogout={logout}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto w-full">
        {activeTab === "Dashboard" ? (
          <DashboardHome user={user} onNavigateToApps={() => setActiveTab("Applications")} />
        ) : (
          <Board />
        )}
      </main>
    </div>
  );
}
