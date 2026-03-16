import { BitcoinChart } from '../charts/BitcoinChart';
import { GoldChart } from '../charts/GoldChart';
import { EtfChart } from '../charts/EtfChart';
import { PropertyChart } from '../charts/PropertyChart';
import { DanangChart } from '../charts/DanangChart';
import { PriceCard } from '../common/PriceCard';
import { Header } from '../common/Header';
import { lineColors } from '../../utils/chartConfig';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { formatVND } from '../../utils/formatters';

export function Dashboard() {
  const { latest } = useGoldPrice('ALL');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '16px 20px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* Price cards */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <PriceCard label="Bitcoin" value="—" />
          <PriceCard label="Vàng SJC" value={formatVND(latest.sjcBuy)} />
          <PriceCard label="Vàng 9999" value={formatVND(latest.v9999Buy)} />
        </div>

        {/* Bitcoin - full width */}
        <div style={{ marginBottom: 16 }}>
          <BitcoinChart />
        </div>

        {/* Gold & Property */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          <GoldChart />
          <PropertyChart />
        </div>

        {/* Da Nang districts - full width */}
        <div style={{ marginBottom: 16 }}>
          <DanangChart />
        </div>

        {/* ETFs - separate charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          <EtfChart ticker="E1VFVN30.VN" title="VN30 ETF" color={lineColors.blue} />
          <EtfChart ticker="FUESSV30.VN" title="VNFIN LEAD ETF" color={lineColors.purple} />
          <EtfChart ticker="FUEVFVND.VN" title="VN Diamond ETF" color={lineColors.cyan} />
        </div>
      </main>
    </div>
  );
}
