import { useMemo } from 'react';
import { getDanangData, type DistrictKey } from '../services/danangData';
import type { PricePoint, TimeRange } from '../types/market';
import { filterByTimeRange } from './usePropertyPrice';

export function useDanangPrice(timeRange: TimeRange) {
  return useMemo(() => {
    const data = getDanangData();
    const result = {} as Record<DistrictKey, PricePoint[]>;
    for (const key of Object.keys(data) as DistrictKey[]) {
      result[key] = filterByTimeRange(data[key], timeRange);
    }
    return result;
  }, [timeRange]);
}
