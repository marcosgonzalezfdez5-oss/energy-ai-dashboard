'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMe, getPlants, UserProfile, Plant } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import PlantSidebar from "@/components/PlantSidebar";

type ShellProps = {
  token: string;
  profile: UserProfile;
  plant: Plant | null;
};

type Props = {
  children: (props: ShellProps) => React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const session = sessionData.session;
      if (!session) {
        router.replace("/");
        return;
      }
      const t = session.access_token;
      setToken(t);
      try {
        const [me, plantList] = await Promise.all([getMe(t), getPlants(t)]);
        setProfile(me);
        setPlants(plantList);

        const plantIdFromUrl = searchParams.get("plant");
        const initial =
          plantList.find((p) => p.id === plantIdFromUrl) ?? plantList[0] ?? null;
        setSelectedPlant(initial);

        if (!plantIdFromUrl && initial && window.location.pathname !== "/overview") {
          const current = new URL(window.location.href);
          current.searchParams.set("plant", initial.id);
          router.replace(current.pathname + current.search);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the token in sync with Supabase's background refresh, so a long-open
  // tab doesn't keep sending an expired token to the API routes.
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setToken(session.access_token);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (plants.length === 0) return;
    const plantIdFromUrl = searchParams.get("plant");
    const match = plants.find((p) => p.id === plantIdFromUrl) ?? null;
    if (match) setSelectedPlant(match);
  }, [searchParams, plants]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-t400">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  const initials = profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex h-screen bg-page">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-th flex flex-col bg-page
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo header */}
        <div className="px-4 py-4 border-b border-th flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-t50 leading-none tracking-tight">Solar Operations</p>
            <p className="text-[11px] text-t500 mt-0.5 leading-none">Intelligence Platform</p>
          </div>
        </div>

        {/* Plant navigation */}
        <PlantSidebar
          plants={plants}
          selectedPlantId={selectedPlant?.id ?? null}
        />

        {/* Theme toggle */}
        <div className="px-2 py-2 border-t border-th">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-t400 hover:bg-surface-50 hover:text-t200 transition-colors text-sm"
          >
            {theme === "dark" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Light mode
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Dark mode
              </>
            )}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-th">
          {showSignOut && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-surface-60 hover:text-red-300 transition-colors border-b border-th"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          )}

          <button
            onClick={() => setShowSignOut((o) => !o)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-t200 truncate font-medium">{profile?.email}</p>
              <p className="text-xs text-t500 capitalize mt-0.5">{profile?.role}</p>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`text-t600 shrink-0 transition-transform duration-200 ${showSignOut ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-th shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-t400 hover:text-t200 hover:bg-surface transition-colors"
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <span className="text-sm font-semibold text-t50">Solar Operations</span>
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-8 xl:p-10">
          {(selectedPlant || pathname === "/overview") && token && profile ? (
            children({ token, profile, plant: selectedPlant })
          ) : (
            <p className="text-t500">Select a plant to get started.</p>
          )}
        </div>
      </main>
    </div>
  );
}
