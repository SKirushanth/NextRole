import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./api.js";
import Login from "./Login.jsx";
import Board from "./Board.jsx";

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

  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Login onLoggedIn={setUser} />;

  return (
    <div className="shell">
      <header className="topbar">
        <h1>NextRole</h1>
        <div>
          <span className="muted">{user.email}</span>{" "}
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <Board />
    </div>
  );
}