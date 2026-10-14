import { useState } from "react";
import { api, setToken } from "../lib/api.js";
import StrokeText from "../components/StrokeText.jsx";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.register(email, password);
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      onLoggedIn(await api.me());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] flex flex-col items-center justify-center p-4 antialiased selection:bg-[#262626] selection:text-[#FFFFFF]">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Header Brand */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <StrokeText
            text="NextRole"
            fontSize={32}
            strokeColor="#888888"
            fillColor="#FFFFFF"
            strokeWidth={1.2}
          />
          <p className="text-xs text-[#888888] font-medium">
            {mode === "login" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 space-y-5 shadow-2xl">
          {/* Tabs Switcher */}
          <div className="flex border-b border-[#262626]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                color: mode === "login" ? "#FFFFFF" : "#888888",
                borderBottom: mode === "login" ? "2px solid #FFFFFF" : "2px solid transparent"
              }}
              className="flex-1 pb-3 text-xs font-semibold text-center transition-colors cursor-pointer hover:text-[#FFFFFF]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                color: mode === "register" ? "#FFFFFF" : "#888888",
                borderBottom: mode === "register" ? "2px solid #FFFFFF" : "2px solid transparent"
              }}
              className="flex-1 pb-3 text-xs font-semibold text-center transition-colors cursor-pointer hover:text-[#FFFFFF]"
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-2.5 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg text-xs text-[#F87171] leading-relaxed">
              {error}
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-[#CCCCCC] font-medium block mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{ paddingLeft: "2.5rem" }}
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl pr-3 py-2.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#444444] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#CCCCCC] font-medium block mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="password"
                  value={password}
                  minLength={8}
                  maxLength={72}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: "2.5rem" }}
                  className="w-full bg-[#161616] border border-[#262626] rounded-xl pr-3 py-2.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#444444] transition-colors"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={busy}
              style={{
                backgroundColor: "#2F6FED",
                color: "#FFFFFF",
                border: "none"
              }}
              className="w-full mt-2 hover:bg-[#2558C7] font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#2F6FED]/20 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign in" : "Register"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle Link */}
          <div className="text-center pt-2 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: 0,
                color: "#A3A3A3"
              }}
              className="text-xs hover:text-[#FFFFFF] transition-colors cursor-pointer font-medium"
            >
              {mode === "login"
                ? "Need an account? Register"
                : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

