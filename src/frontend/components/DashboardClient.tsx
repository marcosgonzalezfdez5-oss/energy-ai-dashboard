'use client'

import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import PlantPanel from "@/components/PlantPanel";

function DashboardInner() {
  return (
    <AppShell>
      {({ token, profile, plant }) =>
        plant ? <PlantPanel plant={plant} token={token} profile={profile} /> : null
      }
    </AppShell>
  );
}

export default function DashboardClient() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
