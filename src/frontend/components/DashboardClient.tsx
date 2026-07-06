'use client'

import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import PlantPanel from "@/components/PlantPanel";
import MyWidgetsSection from "@/components/widgets/MyWidgetsSection";

function DashboardInner() {
  return (
    <AppShell>
      {({ token, profile, plant }) => (
        <>
          <MyWidgetsSection token={token} />
          {plant ? <PlantPanel plant={plant} token={token} profile={profile} /> : null}
        </>
      )}
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
