import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./api.js";
import Login from "./Login.jsx";
import Board from "./Board.jsx";
import StrokeText from "./StrokeText.jsx";
import { LogOut, Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Restore the session if a token is already stored
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this event when the server says the token is no longer valid
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("nextrole:logout", onLogout);
    return () => window.removeEventListener("nextrole:logout", onLogout);
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  // Dark loading screen matching pitch-black theme
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-[#888888] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
        <span className="text-xs font-mono">Loading session…</span>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) return <Login onLoggedIn={setUser} />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] font-sans antialiased selection:bg-[#262626] selection:text-[#FFFFFF]">
      {/* Sticky Pitch-Black Topbar Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Animated SVG Brand Logo */}
          <div className="flex items-center gap-3">
            <StrokeText
              text="NextRole"
              fontSize={24}
              strokeColor="#888888"
              fillColor="#FFFFFF"
              strokeWidth={1.2}
            />
          </div>

          {/* User Email & Logout Action */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#888888] font-mono">{user.email}</span>
            <div className="h-4 w-px bg-[#262626]" />
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#FFFFFF] transition-colors py-1.5 px-3 rounded-lg border border-[#262626] bg-[#121212] hover:border-[#444444] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Kanban Board Surface */}
      <main className="max-w-7xl mx-auto px-6 py-5 sm:py-6">
        <Board />
      </main>
    </div>
  );
}