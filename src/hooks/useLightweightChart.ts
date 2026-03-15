import { useEffect, useRef, useCallback } from 'react';
import { createChart, type IChartApi, type DeepPartial, type ChartOptions } from 'lightweight-charts';
import { darkChartOptions } from '../utils/chartConfig';

export function useLightweightChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: DeepPartial<ChartOptions>,
) {
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      ...darkChartOptions,
      ...options,
      width: container.clientWidth,
      height: container.clientHeight || 350,
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.applyOptions({ width, height });
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [containerRef, options]);

  const fitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  return { chartRef, fitContent };
}
