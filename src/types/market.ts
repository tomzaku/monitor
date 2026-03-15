export interface OHLCData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PricePoint {
  time: string; // YYYY-MM-DD
  value: number;
}

export interface GoldPricePoint {
  date: string;
  buy: number;
  sell: number;
}

export interface PropertyPricePoint {
  date: string;
  pricePerSqm: number;
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export const TIME_RANGE_MAP: Record<TimeRange, { range: string; interval: string }> = {
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
  'ALL': { range: 'max', interval: '1wk' },
};
