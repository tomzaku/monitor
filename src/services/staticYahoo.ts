import bitcoinData from '../data/bitcoin-historical.json';
import etfE1VFVN30 from '../data/etf-E1VFVN30-historical.json';
import etfFUESSV30 from '../data/etf-FUESSV30-historical.json';
import etfFUEVFVND from '../data/etf-FUEVFVND-historical.json';
import type { OHLCData, PricePoint } from '../types/market';

function cutoffDate(range: string): string {
  const d = new Date();
  switch (range) {
    case '1mo': d.setMonth(d.getMonth() - 1); break;
    case '3mo': d.setMonth(d.getMonth() - 3); break;
    case '6mo': d.setMonth(d.getMonth() - 6); break;
    case '1y':  d.setFullYear(d.getFullYear() - 1); break;
    case '5y':  d.setFullYear(d.getFullYear() - 5); break;
    default: return '1900-01-01';
  }
  return d.toISOString().slice(0, 10);
}

const ohlcSources: Record<string, OHLCData[]> = {
  'BTC-USD': bitcoinData as OHLCData[],
};

const lineSources: Record<string, PricePoint[]> = {
  'E1VFVN30.VN': etfE1VFVN30 as PricePoint[],
  'FUESSV30.VN': etfFUESSV30 as PricePoint[],
  'FUEVFVND.VN': etfFUEVFVND as PricePoint[],
};

export function getStaticOHLC(symbol: string, range: string): OHLCData[] {
  const data = ohlcSources[symbol] ?? [];
  const cutoff = cutoffDate(range);
  return data.filter((e) => e.time >= cutoff);
}

export function getStaticLine(symbol: string, range: string): PricePoint[] {
  const data = lineSources[symbol] ?? [];
  const cutoff = cutoffDate(range);
  return data.filter((e) => e.time >= cutoff);
}
