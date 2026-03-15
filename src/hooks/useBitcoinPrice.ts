import type { TimeRange } from '../types/market';
import { useOHLCData } from './useYahooFinance';

export function useBitcoinPrice(timeRange: TimeRange) {
  return useOHLCData('BTC-USD', timeRange);
}
