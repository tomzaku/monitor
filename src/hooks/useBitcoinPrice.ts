import { useQuery } from '@tanstack/react-query';
import type { TimeRange, OHLCData } from '../types/market';
import { TIME_RANGE_MAP } from '../types/market';
import { getStaticOHLC } from '../services/staticYahoo';

export function useBitcoinPrice(timeRange: TimeRange) {
  const { range } = TIME_RANGE_MAP[timeRange];
  return useQuery<OHLCData[]>({
    queryKey: ['bitcoin', range],
    queryFn: () => getStaticOHLC('BTC-USD', range),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
