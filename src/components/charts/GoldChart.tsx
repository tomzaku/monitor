import { useState, useRef, useEffect } from 'react';
import { LineSeries, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import type { TimeRange } from '../../types/market';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { lineColors, defaultLineStyle } from '../../utils/chartConfig';
import { ChartContainer } from './ChartContainer';

const ref = (text: string, url: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7', textDecoration: 'none' }}>[{text}]</a>
);

const goldFooter = (
  <>
    <strong style={{ color: '#9ca3af' }}>Các đợt giảm giá đáng chú ý:</strong>
    <br /><br />
    • <strong>T8/2020 → T12/2020: -8%</strong> (60.3tr → 55.5tr/lượng).
    Ngày 7-8/8/2020, SJC đạt đỉnh lịch sử 62.4tr do COVID-19 gây hoảng loạn, các NHTW bơm tiền, lãi suất gần 0%.
    Sau đó giảm mạnh vì: (1) Pfizer/BioNTech công bố vaccine hiệu quả 90% vào 9/11/2020, giảm nhu cầu trú ẩn {ref('VOV', 'https://vov.vn/kinh-te/thi-truong/gia-vang-the-gioi-giam-nhe-khi-co-nhung-thong-tin-tich-cuc-ve-vaccine-covid-19-822438.vov')};
    (2) Chốt lời ồ ạt, nhà đầu tư chuyển sang chứng khoán {ref('VietnamBiz', 'https://vietnambiz.vn/nhin-lai-nam-2020-cua-gia-vang-nam-thang-hoa-nhat-lich-su-20201231113248773.htm')};
    (3) USD index tăng từ 92 lên 96, vàng thế giới giảm từ $2,075 xuống $1,680/oz {ref('Tierra', 'https://www.tierra.vn/tin-tuc/gia-vang-nam-2020')}.
    <br /><br />
    • <strong>T4/2022 → T10/2022: -11%</strong> (74.4tr → 66tr/lượng).
    Fed tăng lãi suất 7 lần liên tiếp trong năm 2022, từ 0% lên 4.25% — mức tăng nhanh nhất 40 năm.
    Lợi suất trái phiếu Mỹ 10Y tăng từ 1.5% lên 4.2%, USD index tăng từ 95 lên 114 — kỷ lục 20 năm.
    Vàng mất sức hấp dẫn vì không trả lãi, chi phí cơ hội tăng cao {ref('VietnamPlus', 'https://www.vietnamplus.vn/gia-vang-the-gioi-giam-sau-quyet-dinh-tang-lai-suat-cua-fed-post788314.vnp')}.
    Trong nước: xung đột Nga-Ukraine đẩy SJC lên 74.4tr vào T3, nhưng Fed siết tiền tệ kéo giá xuống {ref('Finhay', 'https://www.finhay.com.vn/en/gia-vang-qua-cac-nam')}.
    <br /><br />
    • <strong>T5/2024 → T7/2024: -16%</strong> (92tr → 77tr/lượng).
    SJC chênh lệch với giá thế giới lên tới 18tr/lượng — mức bất thường.
    NHNN can thiệp mạnh: dừng đấu thầu, chuyển sang bán trực tiếp qua 4 NHTM nhà nước (Vietcombank, BIDV, Agribank, VietinBank) và SJC từ 3/6/2024 với giá gần 79tr {ref('VietnamNet', 'https://vietnamnet.vn/4-ngan-hang-va-sjc-ban-vang-mieng-tu-3-6-gia-vang-mua-tu-nhnn-gan-79-trieu-2287013.html')}.
    Chênh lệch thu hẹp từ 18tr xuống còn 6tr/lượng {ref('DIV', 'https://www.div.gov.vn/chenh-lech-gia-ban-vang-mieng-sjc-trong-nuoc-va-quoc-te-duoc-thu-hep')}.
    Kết quả: SJC giảm từ 92tr xuống 77tr chỉ trong 2 tháng {ref('VTC News', 'https://vtcnews.vn/gia-vang-nam-2024-da-dien-bien-the-nao-ar916858.html')}.
    <br /><br />
    • <strong>T10/2025 → T12/2025:</strong> SJC dao động 152-155tr. Chốt lời cuối năm, kỳ vọng Fed giữ lãi suất cao hơn lâu hơn.
    <br /><br />
    • <strong>T1/2026: -12.5% trong 2 phiên</strong> (190tr → 169tr) — mức giảm chưa từng có.
    Ngày 29-30/1, vàng thế giới giảm tổng cộng 700 USD/oz (-12.5%) xuống $4,891.
    Nguyên nhân: (1) Trump đề cử Kevin Warsh làm Chủ tịch Fed mới, giảm lo ngại về độc lập NHTW → USD tăng vọt {ref('Thanh Niên', 'https://thanhnien.vn/gia-vang-hom-nay-122026-cu-nhao-lon-khien-nha-dau-tu-lo-23-trieu-dong-185260201072834614.htm')};
    (2) Thanh lý vị thế mua (long liquidation) ồ ạt trên sàn COMEX {ref('VietnamNet', 'https://vietnamnet.vn/vang-giam-sau-chua-tung-co-trong-lich-su-tin-hieu-cho-su-thay-doi-lon-2486772.html')};
    (3) Chuyên gia nhận định: vàng đã chuyển từ tài sản phòng thủ sang tài sản đầu cơ {ref('TNCKVN', 'https://www.tinnhanhchungkhoan.vn/con-dia-chan-vang-nam-2026-vang-da-chuyen-tu-tai-san-phong-thu-sang-tai-san-dau-co-post384869.html')}.
    Trong nước: SJC sáng 31/1 giảm còn 169tr mua / 172tr bán, mất gần 20tr từ đỉnh 29/1 {ref('CafeF', 'https://cafef.vn/gia-vang-giam-manh-dau-nam-moi-binh-ngo-2026-188260218083747856.chn')}.
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
      aiContext={`Lịch sử giá vàng SJC (triệu VND/lượng):
- 2016-2018: đi ngang 35-37tr
- 2019: tăng 16%, cuối năm 42.75tr
- 2020: đỉnh COVID 60.3tr (T8), cuối năm 55.5tr
- 2021: 56tr → 61tr
- 2022: đỉnh 74.4tr (T4, do Nga-Ukraine), giảm về 66tr (Fed tăng lãi suất)
- 2023: tăng lên 80.3tr cuối năm
- 2024: đỉnh 92tr (T5), NHNN bình ổn → giảm về 77tr, phục hồi 86tr cuối năm
- 2025: bùng nổ 124tr (T4) → 155tr (T10) → giảm 152tr cuối năm
- T1/2026: crash -12.5% (190tr → 169tr), T3/2026 hiện tại: ~180tr
Vàng 9999 (nhẫn) theo sát SJC, hiện ~180tr.
Lãi suất tiết kiệm VN hiện ~5-6%/năm.`}
      aiQuestion="Giá vàng SJC hiện tại ~180 triệu, có nên mua vàng bây giờ hay chờ? So sánh với gửi tiết kiệm và BĐS."
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div ref={containerRef} style={{ width: '100%', height: 350 }} />
    </ChartContainer>
  );
}
