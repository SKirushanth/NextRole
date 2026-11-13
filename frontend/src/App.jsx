import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./lib/api.js";
import Login from "./pages/Login.jsx";
import Board from "./pages/Board.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [activeTab, setActiveTab] = useState("Dashboard");

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
      <Sidebar
        user={user}
        onLogout={logout}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 p-6">
        {activeTab === "Dashboard" ? (
          <DashboardHome user={user} onNavigateToApps={() => setActiveTab("Applications")} />
        ) : (
          <Board />
        )}
      </main>
    </div>
  );
}