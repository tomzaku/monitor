import type { TimeRange } from '../types/market';
import { useLineData } from './useYahooFinance';

export function useEtfPrice(ticker: string, timeRange: TimeRange) {
  return useLineData(ticker, timeRange);
}
