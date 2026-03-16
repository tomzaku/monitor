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
    <br /><br />
    <strong style={{ color: '#9ca3af' }}>Các đợt giảm giá đáng chú ý:</strong>
    <br />
    • <strong>2018 → 2020 (Đà Nẵng, Nha Trang, Phú Quốc):</strong> Giảm 20-35%. Sau cơn sốt đất 2017-2018 (APEC Đà Nẵng, đầu cơ lướt sóng), giá bị đẩy quá cao so với giá trị thực. Chính quyền siết quản lý, COVID-19 đóng cửa du lịch, nhà đầu tư vay nợ phải bán tháo.
    <br />
    • <strong>2022 → 2023 (cả nước):</strong> Giảm 15-30%. Fed tăng lãi suất → NHNN tăng lãi suất cho vay lên 12-14%/năm, tín dụng BĐS bị siết chặt. Vụ Tân Hoàng Minh, Vạn Thịnh Phát gây mất niềm tin thị trường trái phiếu doanh nghiệp. Thanh khoản đóng băng.
    <br />
    • <strong>Phú Quốc 2022 → 2023:</strong> Giảm mạnh nhất (-45%), từ 80tr xuống 43tr/m². Bong bóng condotel vỡ, nhiều dự án bỏ hoang, pháp lý chưa rõ ràng cho sổ đỏ condotel.
    <br />
    • <strong>2024 → nay:</strong> Hồi phục 20-40% từ đáy, đặc biệt HCM và Hà Nội. Đà Nẵng phục hồi chậm hơn do phụ thuộc du lịch và thiếu dân cư thực.
    <br /><br />
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
      proofs={[
        { step: 'Quarterly market reports', url: 'https://batdongsan.com.vn/bao-cao-thi-truong', detail: 'Primary source: Batdongsan.com.vn quarterly reports with avg price/m² per city for apartments.' },
        { step: 'Savills Vietnam research', url: 'https://www.savills.com.vn/research-and-news/vietnam-research.aspx', detail: 'Cross-referenced with Savills quarterly market updates for HCM, Hanoi, Da Nang apartment segments.' },
        { step: 'CBRE Vietnam reports', url: 'https://www.cbre.com.vn/en/research', detail: 'CBRE quarterly insights used for Hanoi and HCM high-end segment pricing verification.' },
        { step: 'Phú Quốc condotel crash', url: 'https://cafef.vn/bong-bong-bat-dong-san.html', detail: 'CafeF report on Phú Quốc property bubble burst 2022-2023, condotel price collapse from 80tr to 43tr/m².' },
        { step: 'VnExpress BĐS analysis', url: 'https://vnexpress.net/bat-dong-san', detail: 'VnExpress real estate section for current market trends, price per m² data, and recovery signals 2024-2025.' },
      ]}
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
