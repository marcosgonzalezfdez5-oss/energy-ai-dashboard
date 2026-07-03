'use client'

import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import DailyDetailPanel from "@/components/DailyDetailPanel";

function DailyDetailInner() {
  return (
    <AppShell>
      {({ token, profile, plant }) =>
        plant ? <DailyDetailPanel plant={plant} token={token} profile={profile} /> : null
      }
    </AppShell>
  );
}

export default function DailyDetailClient() {
  return (
    <Suspense>
      <DailyDetailInner />
    </Suspense>
  );
}
