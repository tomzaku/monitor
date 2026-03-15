import { useState, useRef, useEffect, useCallback } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time, type LineWidth } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { usePropertyPrice } from '../../hooks/usePropertyPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';
import type { PropertyKey } from '../../services/propertyData';

const LINES: { key: PropertyKey; label: string; color: string; width: LineWidth }[] = [
  { key: 'canuoc', label: 'Cả nước (TB)', color: '#ffffff', width: 3 },
  { key: 'hcm', label: 'HCM', color: lineColors.red, width: 2 },
  { key: 'hanoi', label: 'Hà Nội', color: lineColors.blue, width: 2 },
  { key: 'danang', label: 'Đà Nẵng', color: lineColors.orange, width: 2 },
  { key: 'nhatrang', label: 'Nha Trang', color: lineColors.green, width: 2 },
  { key: 'phuquoc', label: 'Phú Quốc', color: lineColors.purple, width: 2 },
];

const ALL_KEYS = new Set(LINES.map((l) => l.key));

const footerContent = (
  <>
    <strong style={{ color: '#9ca3af' }}>Phương pháp:</strong> Giá trung bình/m² căn hộ chung cư, tổng hợp từ báo cáo quý
    của Batdongsan.com.vn, Savills Vietnam, CBRE Vietnam. "Cả nước (TB)" là trung bình cộng của 5 thành phố trên biểu đồ.
    Đà Nẵng: giá trung bình khu vực Hải Châu, Sơn Trà, Ngũ Hành Sơn — phản ánh phân khúc trung cấp đến cao cấp ven biển.
    <br />
    <strong style={{ color: '#9ca3af' }}>Lưu ý:</strong> Dữ liệu mang tính tham khảo xu hướng dài hạn, không phải giá giao dịch thực tế tại từng thời điểm.
  </>
);

export function PropertyChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [visible, setVisible] = useState<Set<PropertyKey>>(new Set(ALL_KEYS));
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRefs = useRef<Map<PropertyKey, ISeriesApi<'Line'>>>(new Map());
  const lastChartRef = useRef<unknown>(null);
  const data = usePropertyPrice(timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  const toggleLine = useCallback((key: PropertyKey) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (lastChartRef.current !== chart) {
      seriesRefs.current.clear();
      lastChartRef.current = chart;
    }

    for (const line of LINES) {
      if (!seriesRefs.current.has(line.key)) {
        seriesRefs.current.set(
          line.key,
          chart.addSeries(LineSeries, {
            ...defaultLineStyle,
            color: line.color,
            lineWidth: line.width,
            title: line.label,
          }),
        );
      }

      const series = seriesRefs.current.get(line.key)!;
      const isVisible = visible.has(line.key);

      series.applyOptions({ visible: isVisible });

      if (isVisible) {
        const lineData = data[line.key];
        if (lineData?.length) {
          series.setData(
            lineData.map((d) => ({ time: d.time as Time, value: d.value })) as LineData<Time>[],
          );
        }
      }
    }
    fitContent();
  }, [data, chartRef, fitContent, visible]);

  return (
    <ChartContainer
      title="Bất Động Sản"
      subtitle="Giá trung bình / m² (VND) · Dữ liệu tĩnh"
      source={{ label: 'Batdongsan.com.vn · Savills · CBRE', url: 'https://batdongsan.com.vn/bao-cao-thi-truong' }}
      footer={footerContent}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
        {LINES.map((line) => {
          const active = visible.has(line.key);
          return (
            <button
              key={line.key}
              onClick={() => toggleLine(line.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${active ? line.color : '#2a2a4a'}`,
                borderRadius: 4,
                cursor: 'pointer',
                background: active ? `${line.color}18` : 'transparent',
                color: active ? line.color : '#4b5563',
                opacity: active ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: active ? line.color : '#4b5563',
              }} />
              {line.label}
            </button>
          );
        })}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 370 }} />
    </ChartContainer>
  );
}
