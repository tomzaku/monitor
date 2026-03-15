import { useMemo } from 'react';
import { getGoldData, getLatestGoldPrices } from '../services/goldData';
import type { TimeRange } from '../types/market';
import { filterByTimeRange } from './usePropertyPrice';

export function useGoldPrice(timeRange: TimeRange) {
  return useMemo(() => {
    const data = getGoldData();
    return {
      sjc: filterByTimeRange(data.sjc, timeRange),
      vang9999: filterByTimeRange(data.vang9999, timeRange),
      latest: getLatestGoldPrices(),
    };
  }, [timeRange]);
}
