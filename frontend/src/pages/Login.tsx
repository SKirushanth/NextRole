import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import { api, setToken } from "../lib/api";
import StrokeText from "../components/StrokeText";
import type { UserResponse } from "../types";

type AuthMode = "login" | "register";

interface LoginProps {
  onLoggedIn: (user: UserResponse) => void;
}

interface SlideItem {
  titleLine1: string;
  titleLine2: string;
  description: string;
}

const SLIDES: SlideItem[] = [
  {
    titleLine1: "Every application.",
    titleLine2: "One place.",
    description: "Track roles, stages and follow-ups without the spreadsheet.",
  },
  {
    titleLine1: "Know where",
    titleLine2: "you stand.",
    description: "See every role move from saved to offer at a glance.",
  },
  {
    titleLine1: "Never miss a",
    titleLine2: "follow-up.",
    description: "Quiet reminders keep every application moving forward.",
  },
  {
    titleLine1: "Your next role",
    titleLine2: "starts here.",
    description: "Sign in to pick up right where you left off.",
  },
];

const SLIDE_DURATION_MS = 4600;

function InputWrapper({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    wrapperRef.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    wrapperRef.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group/input relative rounded-[11px] bg-zinc-200/85 p-[1.5px]"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 ${
          hovered ? "opacity-100" : "opacity-0 group-focus-within/input:opacity-100"
        }`}
        style={{
          background:
            "radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14, 165, 233, 0.45), rgba(99, 102, 241, 0.35), transparent 80%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SlideGraphic({ slideId }: { slideId: number }) {
  if (slideId === 0) {
    return (
      <svg className="h-48 w-48 sm:h-56 sm:w-56" viewBox="0 0 220 220" fill="none" aria-label="Layered NextRole monogram">
        <path d="M66 142V66L134 142V66M92 168V92L160 168V92" stroke="#D4D4D8" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M79 155V79L147 155V79" stroke="#09090B" strokeWidth="3.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (slideId === 1) {
    return (
      <div className="flex w-full justify-start sm:pl-6">
        <div className="relative flex h-64 flex-col justify-between py-2">
          <div className="absolute bottom-4 left-[9px] top-4 w-[1.5px] bg-zinc-200" />
          <div className="absolute left-[9px] top-4 h-[66%] w-[1.5px] bg-zinc-900" />
          {["Saved", "Applied", "Interview", "Offer"].map((stage, index) => (
            <div key={stage} className="relative z-10 flex items-center gap-6">
              <span className="flex h-5 w-5 items-center justify-center">
                <span
                  className={`h-3.5 w-3.5 rounded-full ${
                    index < 2 ? "bg-zinc-950" : index === 2 ? "border-[1.5px] border-zinc-950 bg-zinc-50" : "border border-zinc-300 bg-zinc-50"
                  }`}
                >
                  {index === 2 && <span className="block h-2 w-2 rounded-full bg-zinc-950" />}
                </span>
              </span>
              <span className={`${index === 2 ? "text-xl font-semibold text-zinc-950" : index === 3 ? "text-lg text-zinc-400" : "text-lg text-zinc-500"} tracking-tight`}>
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === 2) {
    return (
      <div className="w-full max-w-[340px] space-y-3.5">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
              item === 1
                ? "scale-[1.02] border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/[0.06]"
                : "border-zinc-200/70 bg-zinc-100/80 opacity-80"
            }`}
          >
            <span className={`h-5 w-5 shrink-0 rounded-full ${item === 1 ? "bg-zinc-950" : "border border-zinc-300 bg-white/70"}`}>
              {item === 1 && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
            <div className="flex-1 space-y-2">
              <div className={`h-2 w-32 rounded-full ${item === 1 ? "bg-zinc-950" : "bg-zinc-300/90"}`} />
              <div className="h-2 w-20 rounded-full bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-40 w-40 items-center justify-center rounded-[38px] bg-zinc-950 text-white shadow-xl shadow-zinc-950/15 sm:h-48 sm:w-48">
      <svg className="h-20 w-20" viewBox="0 0 80 80" fill="none" aria-label="NextRole app icon">
        <path d="M22 58V22L58 58V22" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Login({ onLoggedIn }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((index + SLIDES.length) % SLIDES.length);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setProgress((value) => {
        const next = value + (delta / SLIDE_DURATION_MS) * 100;
        if (next >= 100) {
          goToSlide(currentSlide + 1);
          return 0;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentSlide, goToSlide, paused]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.register(email, password);
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      onLoggedIn(await api.me());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-zinc-950 antialiased selection:bg-sky-500/20 selection:text-sky-900">
      <main className="relative grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <div aria-hidden="true" className="pointer-events-none fixed -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-sky-200/35 blur-[130px]" />
        <div aria-hidden="true" className="pointer-events-none fixed bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-indigo-200/30 blur-[130px]" />

        <section
          className="relative flex flex-col justify-between bg-white px-6 py-8 sm:px-12 lg:px-16 xl:px-24"
          style={{ backgroundImage: "radial-gradient(#e4e4e7 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#ffffff_85%)]" />
          <header className="relative z-10 flex items-center justify-between">
            <StrokeText
              text="NextRole"
              fontSize={30}
              strokeColor="#71717A"
              fillColor="#09090B"
              strokeWidth={1.2}
              className="h-9"
            />
            <div className="hidden items-center gap-2 text-[10px] font-medium text-zinc-400 sm:flex">
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Your career, organized</span>
            </div>
          </header>

          <div className="relative z-10 my-auto mx-auto w-full max-w-[410px] py-10">
            <div className="mb-6 h-[1.5px] w-24 bg-gradient-to-r from-sky-500/80 via-indigo-500/60 to-transparent" />
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-zinc-200/80 bg-zinc-100 p-1">
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeMode(item)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === item ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {item === "login" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>

            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                {mode === "register" ? "Register" : "Sign in"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {mode === "register" ? "Register to start tracking every application in one place." : "Sign in to pick up right where you left off."}
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs text-rose-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-zinc-700">Email Address</label>
                <InputWrapper>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 z-10 h-4 w-4 text-zinc-400" />
                    <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required className="w-full rounded-[9.5px] border border-zinc-200 bg-white py-2.5 pr-3 pl-10 text-sm text-zinc-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                  </div>
                </InputWrapper>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-zinc-700">Password</label>
                <InputWrapper>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 z-10 h-4 w-4 text-zinc-400" />
                    <input id="password" type={showPassword ? "text" : "password"} value={password} minLength={8} maxLength={72} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required className="w-full rounded-[9.5px] border border-zinc-200 bg-white py-2.5 pr-10 pl-10 text-sm text-zinc-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </InputWrapper>
              </div>

              <button type="submit" disabled={busy} className="group relative mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-sm font-medium text-white shadow-md transition-all hover:from-zinc-800 hover:to-zinc-900 disabled:opacity-60">
                <span className="inline-flex items-center gap-2">
                  {busy ? (mode === "register" ? "Registering..." : "Signing in...") : mode === "register" ? "Register" : "Sign in"}
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </span>
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-zinc-500 sm:text-sm">
              {mode === "register" ? "Already have an account?" : "Don't have an account?"}
              <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} className="ml-1.5 font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:text-sky-600">
                {mode === "register" ? "Sign in" : "Register"}
              </button>
            </p>
          </div>

          <footer className="relative z-10 flex items-center justify-between text-[11px] text-zinc-400">
            <span>© 2026 NextRole Inc.</span>
            <div className="flex gap-4"><a href="#privacy" className="hover:text-zinc-700">Privacy</a><a href="#terms" className="hover:text-zinc-700">Terms</a></div>
          </footer>
        </section>

        <section className="relative hidden items-center justify-center bg-white p-6 lg:flex" aria-label="Feature Showcase">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={(event) => { touchStartX.current = event.changedTouches[0].screenX; setPaused(true); }}
            onTouchEnd={(event) => { const diff = event.changedTouches[0].screenX - touchStartX.current; if (Math.abs(diff) > 45) goToSlide(diff < 0 ? currentSlide + 1 : currentSlide - 1); setPaused(false); }}
            className="relative h-full min-h-[680px] w-full overflow-hidden rounded-[28px] border border-zinc-200/90 bg-zinc-50/90 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)]"
          >
            <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-12">
              <div className="flex justify-end text-xs font-medium tracking-wider text-zinc-400">0{currentSlide + 1} / 0{SLIDES.length}</div>
              <div className="relative my-4 flex-1">
                {SLIDES.map((slide, index) => (
                  <article key={slide.titleLine1} className={`absolute inset-0 flex h-full flex-col justify-between transition-all duration-700 ${index === currentSlide ? "visible z-10 translate-y-0 opacity-100" : "invisible z-0 translate-y-4 opacity-0"}`}>
                    <div className="flex flex-1 items-center justify-center"><SlideGraphic slideId={index} /></div>
                    <div className="max-w-md">
                      <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-[42px]">{slide.titleLine1}<br />{slide.titleLine2}</h2>
                      <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-zinc-500">{slide.description}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="flex max-w-[220px] flex-1 items-center gap-2">
                  {SLIDES.map((slide, index) => (
                    <button key={slide.titleLine1} type="button" aria-label={`Go to slide ${index + 1}`} onClick={() => goToSlide(index)} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
                      <span className="block h-full rounded-full bg-zinc-950" style={{ width: `${index < currentSlide ? 100 : index === currentSlide ? progress : 0}%` }} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => goToSlide(currentSlide - 1)} aria-label="Previous slide" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" onClick={() => goToSlide(currentSlide + 1)} aria-label="Next slide" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
