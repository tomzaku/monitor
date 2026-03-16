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

const ref = (text: string, url: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7', textDecoration: 'none' }}>[{text}]</a>
);

const footerContent = (
  <>
    <strong style={{ color: '#9ca3af' }}>Phương pháp:</strong> Giá trung bình/m² căn hộ chung cư, tổng hợp từ báo cáo quý
    của Batdongsan.com.vn, Savills Vietnam, CBRE Vietnam. "Cả nước (TB)" là trung bình cộng của 5 thành phố trên biểu đồ.
    <br /><br />
    <strong style={{ color: '#9ca3af' }}>Các đợt giảm giá đáng chú ý:</strong>
    <br /><br />
    • <strong>2018 → 2020 (Đà Nẵng, Nha Trang, Phú Quốc): -20% đến -35%.</strong>{' '}
    Cơn sốt đất 2017-2018 bắt nguồn từ APEC Đà Nẵng (11/2017) và cầu Rồng/Trần Thị Lý hoàn thành, đẩy giá đất Sơn Trà lên gấp 3 lần trong 2 năm.
    Giá bị đẩy vượt xa giá trị thực bởi đầu cơ lướt sóng, nhiều khu vực mật độ dân cư còn thưa thớt {ref('Nguoi Quan Sat', 'https://nguoiquansat.vn/con-sot-bat-dong-san-da-nang-loi-nhuan-cao-hay-bong-bong-ao-208901.html')}.
    Năm 2019 chính quyền siết quản lý phân lô bán nền, thị trường "hạ nhiệt" ngay lập tức.
    COVID-19 (2020) đóng cửa du lịch — ngành xương sống của Đà Nẵng/Nha Trang/Phú Quốc — khiến giá giảm thêm 15-20% {ref('Tuổi Trẻ', 'https://tuoitre.vn/dat-da-nang-rot-gia-the-tham-nhieu-nguoi-vo-no-20200914075900388.htm')}.
    <br /><br />
    • <strong>2022 → 2023 (cả nước): -15% đến -30%.</strong>{' '}
    Fed tăng lãi suất 7 lần trong 2022 (0% → 4.25%). NHNN buộc phải tăng lãi suất cho vay BĐS lên 12-14%/năm.
    Cùng lúc: vụ án Tân Hoàng Minh (bắt T4/2022, trái phiếu 10,000 tỷ), Vạn Thịnh Phát/SCB (T10/2022) gây sụp đổ niềm tin thị trường trái phiếu doanh nghiệp — kênh huy động vốn chính của BĐS {ref('Intracom', 'https://intracom.com.vn/bds-dong-bang/')}.
    Thanh khoản đóng băng: Đà Nẵng ghi nhận "nhiều người bán, ít người mua, giao dịch chuyển nhượng gần như chững lại" {ref('Dân Trí', 'https://dantri.com.vn/bat-dong-san/qua-thoi-sot-nong-bat-dong-san-da-nang-giam-25-30-van-e-am-20230222150718951.htm')}.
    Nhà đầu tư dùng đòn bẩy cao buộc phải bán tháo cắt lỗ để trả lãi ngân hàng {ref('Kinh tế Đô thị', 'https://kinhtedothi.vn/dat-nen-tai-da-nang-giam-gia-sau-van-hiem-giao-dich.html')}.
    <br /><br />
    • <strong>Phú Quốc 2022 → 2023: -45%</strong> (80tr → 43tr/m²).{' '}
    Bong bóng condotel vỡ: nhiều dự án bỏ hoang, pháp lý sổ đỏ condotel chưa rõ ràng, cam kết lợi nhuận 8-12%/năm không thực hiện được.
    Khách mua condotel qua Zoom thời COVID nay bán lỗ cả tỷ vẫn ế {ref('CafeF', 'https://cafef.vn/bong-bong-bat-dong-san.html')}.
    <br /><br />
    • <strong>2024 → nay: Hồi phục 20-40% từ đáy.</strong>{' '}
    HCM và Hà Nội phục hồi nhanh nhờ nhu cầu ở thực, tín dụng nới lỏng (lãi suất giảm về 8-9%/năm).
    Đà Nẵng phục hồi chậm hơn do phụ thuộc du lịch và thiếu dân cư thực — nhưng Hòa Xuân đã tăng 20-30% YoY (2025) {ref('Dân Trí', 'https://dantri.com.vn/bat-dong-san/sau-thoi-gian-im-lim-gia-dat-nen-da-nang-tang-tro-lai-20250812001516641.htm')}.
    Sơn Trà +41%, Ngũ Hành Sơn +33% từ đáy 2023 {ref('Tạp chí Đô thị', 'https://tapchidothi.com/gia-bat-dong-san-da-nang-t5-2025-bao-cao-phan-tich-moi-nhat/')}.
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
