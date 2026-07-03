export const MOVING_AVERAGE_WINDOW = 7;

export type ChartPoint = { ts: string; value: number; ma?: number };

/** Attach a trailing rolling average to each point. Points with fewer than
 *  `window` predecessors still get a value (average of available points). */
export function attachMovingAverage(
  data: ChartPoint[],
  window = MOVING_AVERAGE_WINDOW
): ChartPoint[] {
  return data.map((point, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
    return { ...point, ma: Math.round(avg * 1000) / 1000 };
  });
}
