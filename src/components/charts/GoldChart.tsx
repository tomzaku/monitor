import { useState, useRef, useEffect } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';

const goldFooter = (
  <>
    <strong style={{ color: '#9ca3af' }}>Các đợt giảm giá đáng chú ý:</strong>
    <br />
    • <strong>T8/2020 → T12/2020:</strong> SJC giảm từ 60.3tr xuống 55.5tr/lượng (-8%). Sau khi đạt đỉnh kỷ lục do COVID-19, chốt lời ồ ạt khi vaccine được công bố, USD mạnh lên.
    <br />
    • <strong>T4/2022 → T10/2022:</strong> SJC giảm từ 74.4tr xuống 66tr/lượng (-11%). Fed tăng lãi suất mạnh nhất 40 năm (từ 0% lên 4%), USD index tăng vọt, vàng mất sức hấp dẫn.
    <br />
    • <strong>T5/2024 → T7/2024:</strong> SJC giảm từ 92tr xuống 77tr/lượng (-16%). NHNN bình ổn giá, bán vàng trực tiếp qua 4 ngân hàng quốc doanh, nguồn cung tăng đột biến.
    <br />
    • <strong>T10/2025 → T12/2025:</strong> SJC giảm từ 155tr xuống 152tr/lượng. Kỳ vọng thay đổi chính sách tiền tệ tại Mỹ, chốt lời cuối năm.
    <br />
    • <strong>T1/2026:</strong> Giảm mạnh 12.5% trong 2 phiên cuối tháng 1 (từ 190tr xuống 169tr) — mức giảm chưa từng có. Nguyên nhân: thay đổi chính sách thuế vàng, kỳ vọng Fed giữ lãi suất cao.
  </>
);

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
      proofs={[
        { step: 'Crawl daily SJC prices (1 year)', url: 'https://webgia.com/gia-vang/sjc/bieu-do-1-nam.html', detail: 'Script scripts/crawl-gold.ts parses embedded Highcharts data from Webgia.com. Extracts buy/sell arrays with [timestamp, price_in_millions]. Runs on npm run dev.' },
        { step: 'Historical prices 2016-2024', url: 'https://www.finhay.com.vn/en/gia-vang-qua-cac-nam', detail: 'Quarterly SJC price milestones (high/low/year-end) compiled from Finhay article covering 2000-2026.' },
        { step: 'Cross-check 2020-2024 data', url: 'https://giavang.com.vn/kien-thuc/bieu-do-bien-dong-gia-vang-qua-cac-nam-2000-2024/', detail: 'Verified key price points (2017 year-end 36.44tr, 2019 year-end 42.75tr, 2020 peak 60.32tr, 2021 year-end 61tr) against Giavang.com.vn.' },
        { step: 'Current prices March 2026', url: 'https://cafef.vn/du-lieu/gia-vang-hom-nay/trong-nuoc.chn', detail: 'Latest SJC and 9999 prices from CafeF. As of 15/03/2026: SJC buy 179.6tr / sell 182.6tr.' },
        { step: 'SJC official chart', url: 'https://sjc.com.vn/bieu-do-gia-vang', detail: 'Official SJC company chart for cross-reference. Note: site has intermittent TLS issues.' },
        { step: 'Verify 2025 peak', url: 'https://vietnamnet.vn/vang-giam-sau-chua-tung-co-trong-lich-su-tin-hieu-cho-su-thay-doi-lon-2486772.html', detail: 'Confirmed T10/2025 peak at 155tr and Jan 2026 crash of -12.5% in 2 sessions from VietnamNet.' },
      ]}
      footer={goldFooter}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div ref={containerRef} style={{ width: '100%', height: 350 }} />
    </ChartContainer>
  );
}
