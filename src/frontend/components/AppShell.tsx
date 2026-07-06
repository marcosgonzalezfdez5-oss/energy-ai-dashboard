'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMe, getPlants, UserProfile, Plant } from "@/lib/api";
import PlantSidebar from "@/components/PlantSidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-t50 leading-tight tracking-tight">
              Solar Operations
            </h1>
            <p className="text-sm text-t500 leading-tight">
              Intelligence Platform
            </p>
          </div>
        </div>

        {/* Plant navigation */}
        <PlantSidebar
          plants={plants}
          selectedPlantId={selectedPlant?.id ?? null}
        />

        {/* Theme toggle */}
        <div className="px-4 py-3 border-t border-th flex items-center justify-between">
          <span className="text-sm text-t400">Dark mode</span>
          <ThemeToggle />
        </div>

        {/* User section */}
        <div className="border-t border-th">
          {showSignOut && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-surface-60 hover:text-red-300 transition-colors border-b border-th"
            >
              <LogOut className="h-[15px] w-[15px]" aria-hidden="true" />
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
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-t600 transition-transform duration-200 ${showSignOut ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-th shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-t400 hover:text-t200 hover:bg-surface active:scale-90 transition-all duration-150"
            aria-label="Open navigation"
          >
            <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
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
