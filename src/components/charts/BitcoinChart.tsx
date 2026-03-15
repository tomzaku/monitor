import { useState, useRef, useEffect } from 'react';
import { CandlestickSeries, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { candlestickColors } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';

export function BitcoinChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastChartRef = useRef<unknown>(null);
  const { data, isLoading, error } = useBitcoinPrice(timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data?.length) return;

    if (lastChartRef.current !== chart) {
      seriesRef.current = null;
      lastChartRef.current = chart;
    }

    if (!seriesRef.current) {
      seriesRef.current = chart.addSeries(CandlestickSeries, candlestickColors);
    }

    seriesRef.current.setData(
      data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })) as CandlestickData<Time>[],
    );
    fitContent();
  }, [data, chartRef, fitContent]);

  return (
    <ChartContainer
      title="Bitcoin / USD"
      source={{ label: 'Yahoo Finance', url: 'https://finance.yahoo.com/quote/BTC-USD/' }}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      isLoading={isLoading}
      error={error?.message}
    >
      <div ref={containerRef} style={{ width: '100%', height: 400 }} />
    </ChartContainer>
  );
}
