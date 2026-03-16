import { useState, useRef, useEffect } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useEtfPrice } from '../../hooks/useEtfPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';

interface Props {
  ticker: string;
  title: string;
  color: string;
}

export function EtfChart({ ticker, title, color }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastChartRef = useRef<unknown>(null);
  const { data, isLoading, error } = useEtfPrice(ticker, timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data?.length) return;

    if (lastChartRef.current !== chart) {
      seriesRef.current = null;
      lastChartRef.current = chart;
    }

    if (!seriesRef.current) {
      seriesRef.current = chart.addSeries(LineSeries, {
        ...defaultLineStyle,
        color,
        title,
      });
    }

    seriesRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.value })) as LineData<Time>[]);
    fitContent();
  }, [data, chartRef, fitContent, color, title]);

  return (
    <ChartContainer
      title={title}
      subtitle={`${ticker} · Từ tháng 7/2023`}
      proofs={[
        { step: 'API call', url: `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=max&interval=1wk`, detail: `Fetch line data for ${ticker} from Yahoo Finance v8 API. ETF listed on HOSE since July 2023.` },
        { step: 'Verify on Yahoo Finance', url: `https://finance.yahoo.com/quote/${ticker}/`, detail: `Cross-check prices on the official Yahoo Finance ${ticker} page.` },
      ]}
      chatId={`etf-${ticker}`}
      aiContext={`ETF ${title} (${ticker}) trên sàn HOSE:
- Niêm yết từ tháng 7/2023
- Theo dõi chỉ số VN30/VNFIN LEAD/VN Diamond tùy loại
- Dữ liệu realtime từ Yahoo Finance
- ETF là cách đầu tư chứng khoán đa dạng hóa, rủi ro thấp hơn cổ phiếu đơn lẻ
- Phí quản lý thấp (~0.5-1%/năm)
- VN-Index hiện dao động quanh 1,200-1,300 điểm`}
      aiQuestion={`ETF ${title} có đáng đầu tư dài hạn không? So sánh với gửi tiết kiệm và vàng.`}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      isLoading={isLoading}
      error={error?.message}
    >
      <div ref={containerRef} style={{ width: '100%', height: 350 }} />
    </ChartContainer>
  );
}
