'use client'

import { WidgetConfig, WidgetConfigSchema, WidgetRow } from "@/lib/widget-config";
import KpiCard from "./KpiCard";
import LineChartWidget from "./LineChartWidget";
import ComparisonChartWidget from "./ComparisonChartWidget";

type Props = { widget: WidgetRow; token: string };

// widgets.config is browser-writable (see supabase/widgets.sql) so it must
// never be trusted as-is — re-validate at render time and degrade to a
// friendly per-widget error rather than crashing.
export default function WidgetRenderer({ widget, token }: Props) {
  const parsed = WidgetConfigSchema.safeParse(widget.config);
  if (!parsed.success) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-th">
        <p className="text-t50 text-sm font-medium mb-1">{widget.title}</p>
        <p className="text-red-400 text-sm">This widget&apos;s configuration is invalid and can&apos;t be displayed.</p>
      </div>
    );
  }

  const config: WidgetConfig = parsed.data;

  switch (config.type) {
    case "kpi":
      return <KpiCard title={widget.title} config={config} token={token} />;
    case "line_chart":
      return <LineChartWidget title={widget.title} config={config} token={token} />;
    case "comparison_chart":
      return <ComparisonChartWidget title={widget.title} config={config} token={token} />;
  }
}
