import { useState, useRef, useEffect, useCallback } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time, type LineWidth } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useDanangPrice } from '../../hooks/useDanangPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';
import type { DistrictKey } from '../../services/danangData';

const DISTRICTS: { key: DistrictKey; label: string; color: string; width: LineWidth }[] = [
  { key: 'haichau', label: 'Hải Châu', color: lineColors.red, width: 2 },
  { key: 'sontra', label: 'Sơn Trà', color: lineColors.blue, width: 2 },
  { key: 'hoaxuan', label: 'Hòa Xuân', color: lineColors.green, width: 2 },
  { key: 'lienchieu', label: 'Liên Chiểu', color: lineColors.cyan, width: 2 },
  { key: 'hoacuong', label: 'Hòa Cường', color: lineColors.orange, width: 2 },
];

const ALL_KEYS = new Set(DISTRICTS.map((d) => d.key));

const footerContent = (
  <>
    <strong style={{ color: '#9ca3af' }}>Phương pháp:</strong> Giá trung bình/m² đất nền theo khu vực, tổng hợp từ dữ liệu giao dịch trên Batdongsan.com.vn và báo cáo của môi giới địa phương.
    <br /><br />
    <strong style={{ color: '#9ca3af' }}>Đặc điểm từng khu vực:</strong>
    <br />
    • <strong>Hải Châu:</strong> Trung tâm thành phố, giá cao nhất và ổn định nhất. Quỹ đất hạn chế, chủ yếu là nhà phố mặt tiền.
    <br />
    • <strong>Sơn Trà:</strong> Khu ven biển, sốt mạnh 2017-2018 do condotel/resort. Giảm sâu khi du lịch đóng cửa (COVID), phục hồi nhanh nhờ hạ tầng An Thượng.
    <br />
    • <strong>Hòa Xuân:</strong> "Điểm nóng" đầu cơ 2020-2022. Giá tăng gấp 3 lần trong 2 năm rồi giảm 35% khi tín dụng siết. Nhiều NĐT vay nợ phải bán tháo.
    <br />
    • <strong>Liên Chiểu:</strong> Giá thấp nhất, hưởng lợi từ quy hoạch cảng Liên Chiểu và đường vành đai. Tăng chậm nhưng ít rủi ro bong bóng.
    <br />
    • <strong>Hòa Cường:</strong> Khu dân cư trung tâm Hải Châu mở rộng, gần cầu Rồng. Giá theo sát Hải Châu nhưng thấp hơn 20-30%.
  </>
);

export function DanangChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [visible, setVisible] = useState<Set<DistrictKey>>(new Set(ALL_KEYS));
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRefs = useRef<Map<DistrictKey, ISeriesApi<'Line'>>>(new Map());
  const lastChartRef = useRef<unknown>(null);
  const data = useDanangPrice(timeRange);
  const { chartRef, fitContent } = useLightweightChart(containerRef);

  const toggleLine = useCallback((key: DistrictKey) => {
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
      title="BĐS Đà Nẵng — Theo khu vực"
      subtitle="Giá đất nền trung bình / m² (VND) · Dữ liệu tĩnh"
      proofs={[
        { step: 'Da Nang price history & cycles', url: 'https://canhocaocap.danang.vn/lich-su-gia-nha-da-nang/', detail: 'Full 20-year cycle analysis: 2005-2008 growth, 2009-2013 crash, 2014-2018 APEC boom, 2019-2022 correction. Key prices per area.' },
        { step: 'District price comparison', url: 'https://toprealty.vn/so-sanh-gia-nha-dat-o-cac-quan-huyen-tai-da-nang-phan-1/', detail: 'Top Realty comparison of land prices across all Da Nang districts. Hải Châu 53-75tr, Sơn Trà 55-70tr, Liên Chiểu 25-35tr.' },
        { step: 'Hòa Xuân market analysis', url: 'https://dantri.com.vn/bat-dong-san/qua-thoi-sot-nong-bat-dong-san-da-nang-giam-25-30-van-e-am-20230222150718951.htm', detail: 'Dân Trí report: BĐS Đà Nẵng giảm 25-30% from peak, Hòa Xuân hardest hit due to speculative buying.' },
        { step: '2025 recovery data', url: 'https://dantri.com.vn/bat-dong-san/sau-thoi-gian-im-lim-gia-dat-nen-da-nang-tang-tro-lai-20250812001516641.htm', detail: 'Dân Trí Aug 2025: Hòa Xuân 55-60tr/m² (up 20-30% YoY), market recovering selectively.' },
        { step: 'Current listings for verification', url: 'https://batdongsan.com.vn/ban-dat-da-nang', detail: 'Live listings on Batdongsan.com.vn to cross-check current asking prices per district.' },
        { step: 'Market trend report T5/2025', url: 'https://tapchidothi.com/gia-bat-dong-san-da-nang-t5-2025-bao-cao-phan-tich-moi-nhat/', detail: 'Tạp chí Đô thị May 2025 report: Ngũ Hành Sơn +33%, Sơn Trà +41% price increase from trough.' },
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
