import { useQuery } from '@tanstack/react-query';
import { fetchOHLC, fetchLineData } from '../services/yahooFinance';
import type { OHLCData, PricePoint, TimeRange } from '../types/market';
import { TIME_RANGE_MAP } from '../types/market';

export function useOHLCData(symbol: string, timeRange: TimeRange) {
  const { range, interval } = TIME_RANGE_MAP[timeRange];
  return useQuery<OHLCData[]>({
    queryKey: ['ohlc', symbol, range, interval],
    queryFn: () => fetchOHLC(symbol, range, interval),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 5000,
  });
}

export function useLineData(symbol: string, timeRange: TimeRange) {
  const { range, interval } = TIME_RANGE_MAP[timeRange];
  return useQuery<PricePoint[]>({
    queryKey: ['line', symbol, range, interval],
    queryFn: () => fetchLineData(symbol, range, interval),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 5000,
  });
}
