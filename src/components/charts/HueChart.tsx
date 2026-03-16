import { useState, useRef, useEffect, useCallback } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time, type LineWidth } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useHuePrice } from '../../hooks/useHuePrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';
import type { HueDistrictKey } from '../../services/hueData';

const ref = (text: string, url: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7', textDecoration: 'none' }}>[{text}]</a>
);

const DISTRICTS: { key: HueDistrictKey; label: string; color: string; width: LineWidth }[] = [
  { key: 'trungtam', label: 'Trung tâm (Phú Xuân)', color: lineColors.red, width: 3 },
  { key: 'ancuu', label: 'An Cựu', color: lineColors.blue, width: 2 },
  { key: 'kimlong', label: 'Kim Long', color: lineColors.green, width: 2 },
  { key: 'thuixuan', label: 'Thủy Xuân', color: lineColors.orange, width: 2 },
  { key: 'phuvang', label: 'Phú Vang', color: lineColors.purple, width: 2 },
];

const ALL_KEYS = new Set(DISTRICTS.map((d) => d.key));

const footerContent = (
  <>
    <strong style={{ color: '#9ca3af' }}>Đặc điểm từng khu vực:</strong>
    <br />
    • <strong>Trung tâm (Phú Xuân/Thuận Hóa):</strong> Khu vực lõi thành phố, đường Bạch Đằng, Nguyễn Huệ. Đạt đỉnh 104tr/m² cuối 2023 khi có tin Huế lên TPTTTW, sau đó giảm mạnh -76% về 24.5tr (T3/2025) khi kỳ vọng không thành hiện thực nhanh {ref('Vietstock', 'https://vietstock.vn/2025/04/gia-dat-hue-ra-sao-sau-khi-len-thanh-pho-truc-thuoc-trung-uong-4220-1294990.htm')}.
    <br />
    • <strong>An Cựu:</strong> Khu đô thị mới phía nam, có dự án An Cựu City đạt giải quy hoạch quốc gia. Giá ổn định hơn trung tâm, 35-58tr/m² {ref('Thanh Niên', 'https://thanhnien.vn/bat-dong-san-hue-bat-ngo-voi-tien-do-cua-an-cuu-city-post871561.html')}.
    <br />
    • <strong>Kim Long:</strong> Khu phía bắc sông Hương, yên tĩnh, giá thấp nhất (~11-13tr/m²). Phù hợp ở thực, ít bị ảnh hưởng bởi đầu cơ.
    <br />
    • <strong>Thủy Xuân:</strong> Khu phía nam, gần lăng tẩm hoàng gia, tiềm năng du lịch. Giá trung bình 20-24tr/m².
    <br />
    • <strong>Phú Vang:</strong> Huyện ven biển, sốt đất mạnh 2021-2022 rồi giảm -40% — mức giảm sâu nhất toàn tỉnh. Nguyên nhân: đầu cơ đón đầu quy hoạch ven biển, hạ tầng chưa theo kịp {ref('Vietstock', 'https://vietstock.vn/2025/04/gia-dat-hue-ra-sao-sau-khi-len-thanh-pho-truc-thuoc-trung-uong-4220-1294990.htm')}.
    <br /><br />
    <strong style={{ color: '#9ca3af' }}>Các đợt biến động:</strong>
    <br />
    • <strong>2021-2022: Sốt đất "Huế lên thành phố trực thuộc TW".</strong> Tin đồn và kỳ vọng Huế sáp nhập Thừa Thiên Huế thành TPTTTW đẩy giá trung tâm tăng gấp 3-4 lần. Đầu cơ ồ ạt vào Phú Vang và Thủy Xuân {ref('Báo TT Huế', 'https://baothuathienhue.vn/kinh-te/thong-tin-thi-truong/bang-gia-dat-moi-se-tac-dong-den-gia-bat-dong-san-nhu-the-nao-144988.html')}.
    <br />
    • <strong>2023 → T3/2025: Giảm mạnh toàn diện.</strong> Trung tâm -76%, Phú Vang -40%, Hương Trà -25%. Nguyên nhân: lãi suất cao, tín dụng siết, và tiến độ lên TPTTTW chậm hơn kỳ vọng. Thị trường "ảm đạm, nhiều người bán ít người mua" {ref('VietnamBiz', 'https://vietnambiz.vn/bat-dong-san-hue-am-dam-202571164547559.htm')}.
    <br />
    • <strong>T1/2025: Huế chính thức lên TPTTTW.</strong> Thị trường bắt đầu có tín hiệu phục hồi, nhưng chậm. Dự kiến AEON Mall và các dự án FDI mới sẽ thúc đẩy nhu cầu thực {ref('Kinh tế Đô thị', 'https://kinhtedothi.vn/bat-dong-san-hue-truoc-chu-ky-tang-truong-nho-ha-tang-va-kinh-te-dich-vu.801799.html')}.
  </>
);

export function HueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [visible, setVisible] = useState<Set<HueDistrictKey>>(new Set(ALL_KEYS));
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRefs = useRef<Map<HueDistrictKey, ISeriesApi<'Line'>>>(new Map());
  const lastChartRef = useRef<unknown>(null);
  const data = useHuePrice(timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  const toggleLine = useCallback((key: HueDistrictKey) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

    for (const district of DISTRICTS) {
      if (!seriesRefs.current.has(district.key)) {
        seriesRefs.current.set(
          district.key,
          chart.addSeries(LineSeries, {
            ...defaultLineStyle,
            color: district.color,
            lineWidth: district.width,
            title: district.label,
          }),
        );
      }

      const series = seriesRefs.current.get(district.key)!;
      series.applyOptions({ visible: visible.has(district.key) });

      if (visible.has(district.key)) {
        const lineData = data[district.key];
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
      title="BĐS Huế — Theo khu vực"
      subtitle="Giá đất trung bình / m² (VND) · Dữ liệu tĩnh"
      proofs={[
        { step: 'Giá đất sau khi lên TPTTTW', url: 'https://vietstock.vn/2025/04/gia-dat-hue-ra-sao-sau-khi-len-thanh-pho-truc-thuoc-trung-uong-4220-1294990.htm', detail: 'Vietstock: Trung tâm Huế từ 28.6tr (Q1/2022) → 104tr (cuối 2023) → 24.5tr (T3/2025). Phú Vang -40%, Hương Trà -25%.' },
        { step: 'Bảng giá đất chính thức 2020-2024', url: 'https://vietnambiz.vn/bang-gia-dat-tai-thua-thien-hue-202332015910559.htm', detail: 'VietnamBiz: Bảng giá đất UBND tỉnh, tăng TB 30% so với giai đoạn 2015-2019. Trung tâm cao nhất 65tr/m².' },
        { step: 'Bảng giá đất mới 2025', url: 'https://etime.danviet.vn/bang-gia-dat-moi-o-hue-gia-o-trung-tam-cham-moc-gan-100-trieu-dong-m-d1391105.html', detail: 'Dân Việt: Bảng giá mới, trung tâm loại 1A vị trí 1 = 97.5tr/m². Kim Long loại 3C = 11.6tr/m².' },
        { step: 'Thị trường BĐS Huế 2025', url: 'https://diaocmientrung.vn/thi-truong-bat-dong-san-hue-2025/', detail: 'Địa ốc Miền Trung: Đất nền trung tâm 60-120tr/m², dự kiến tăng 15-20% so với 2024.' },
        { step: 'Tình trạng ảm đạm 2024-2025', url: 'https://vietnambiz.vn/bat-dong-san-hue-am-dam-202571164547559.htm', detail: 'VietnamBiz: Thị trường chưa khởi sắc, chỉ 19 giao dịch nhà ở riêng lẻ trong Q2/2025.' },
        { step: 'Triển vọng hạ tầng', url: 'https://kinhtedothi.vn/bat-dong-san-hue-truoc-chu-ky-tang-truong-nho-ha-tang-va-kinh-te-dich-vu.801799.html', detail: 'Kinh tế Đô thị: AEON Mall, FDI mới, lên TPTTTW sẽ thúc đẩy nhu cầu thực.' },
      ]}
      footer={footerContent}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
        {DISTRICTS.map((d) => {
          const active = visible.has(d.key);
          return (
            <button
              key={d.key}
              onClick={() => toggleLine(d.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${active ? d.color : '#2a2a4a'}`,
                borderRadius: 4,
                cursor: 'pointer',
                background: active ? `${d.color}18` : 'transparent',
                color: active ? d.color : '#4b5563',
                opacity: active ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: active ? d.color : '#4b5563',
              }} />
              {d.label}
            </button>
          );
        })}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 400 }} />
    </ChartContainer>
  );
}
