import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-page">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-card border-r border-th px-16 relative overflow-hidden">
        {/* Subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
        />

        <div className="relative z-10 text-center max-w-md">
          {/* Solar illustration */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              </div>
              {/* Orbiting dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/60" />
              <div className="absolute -bottom-2 -left-2 w-2 h-2 rounded-full bg-amber-400/30 border border-amber-400/50" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-t50 tracking-tight mb-3">
            Solar Operations
            <br />
            <span className="text-amber-400">Intelligence</span>
          </h1>
          <p className="text-base text-t400 leading-relaxed">
            Monitor, analyze, and optimize your solar energy portfolio with AI-powered insights.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["Real-time monitoring", "AI analytics", "Financial reports", "Multi-plant"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-surface text-t400 border border-th-sub"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo (shown only when left panel is hidden) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </div>
            <span className="text-lg font-bold text-t50">Solar Operations</span>
          </div>

          {/* Auth card */}
          <div className="bg-card border border-th rounded-2xl p-8" style={{ boxShadow: "var(--th-card-shadow)" }}>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-t50">Sign in</h2>
              <p className="text-sm text-t500 mt-1.5">Access your solar operations dashboard</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
