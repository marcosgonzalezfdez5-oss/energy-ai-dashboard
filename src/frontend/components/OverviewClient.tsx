'use client'

import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import OverviewPanel from "@/components/OverviewPanel";

function OverviewInner() {
  return (
    <AppShell>
      {({ token }) => <OverviewPanel token={token} />}
    </AppShell>
  );
}

export default function OverviewClient() {
  return (
    <Suspense>
      <OverviewInner />
    </Suspense>
  );
}
