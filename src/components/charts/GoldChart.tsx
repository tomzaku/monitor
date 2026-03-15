import { useState, useRef, useEffect } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';

export function GoldChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const sjcSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const v9999SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastChartRef = useRef<unknown>(null);
  const { sjc, vang9999 } = useGoldPrice(timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Reset series if chart instance changed
    if (lastChartRef.current !== chart) {
      sjcSeriesRef.current = null;
      v9999SeriesRef.current = null;
      lastChartRef.current = chart;
    }

    if (!sjcSeriesRef.current) {
      sjcSeriesRef.current = chart.addSeries(LineSeries, {
        ...defaultLineStyle,
        color: lineColors.gold,
        title: 'SJC',
      });
    }
    if (!v9999SeriesRef.current) {
      v9999SeriesRef.current = chart.addSeries(LineSeries, {
        ...defaultLineStyle,
        color: lineColors.silver,
        title: '9999',
      });
    }

    if (sjc.length) {
      sjcSeriesRef.current.setData(sjc.map((d) => ({ time: d.time as Time, value: d.value })) as LineData<Time>[]);
    }
    if (vang9999.length) {
      v9999SeriesRef.current.setData(vang9999.map((d) => ({ time: d.time as Time, value: d.value })) as LineData<Time>[]);
    }
    fitContent();
  }, [sjc, vang9999, chartRef, fitContent]);

  return (
    <ChartContainer
      title="Vàng SJC & 9999"
      subtitle="Giá mua (VND) · Dữ liệu tĩnh"
      source={{ label: 'Finhay · CafeF', url: 'https://www.finhay.com.vn/en/gia-vang-qua-cac-nam' }}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div ref={containerRef} style={{ width: '100%', height: 350 }} />
    </ChartContainer>
  );
}
