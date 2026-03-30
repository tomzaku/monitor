import { useQuery } from '@tanstack/react-query';
import type { TimeRange, PricePoint } from '../types/market';
import { TIME_RANGE_MAP } from '../types/market';
import { getStaticLine } from '../services/staticYahoo';

export function useEtfPrice(ticker: string, timeRange: TimeRange) {
  const { range } = TIME_RANGE_MAP[timeRange];
  return useQuery<PricePoint[]>({
    queryKey: ['etf', ticker, range],
    queryFn: () => getStaticLine(ticker, range),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
