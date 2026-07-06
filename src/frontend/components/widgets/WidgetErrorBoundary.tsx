'use client'

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallbackTitle: string };
type State = { hasError: boolean };

// One widget referencing a stale plant/datasource (or any other render-time
// throw) must not take down the rest of the dashboard's widget section.
export default class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Widget render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card rounded-2xl p-6 border border-th">
          <p className="text-t50 text-sm font-medium mb-1">{this.props.fallbackTitle}</p>
          <p className="text-red-400 text-sm">This widget couldn&apos;t be displayed.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
