import { useMemo } from 'react';
import { getHueData, type HueDistrictKey } from '../services/hueData';
import type { PricePoint, TimeRange } from '../types/market';
import { filterByTimeRange } from './usePropertyPrice';

export function useHuePrice(timeRange: TimeRange) {
  return useMemo(() => {
    const data = getHueData();
    const result = {} as Record<HueDistrictKey, PricePoint[]>;
    for (const key of Object.keys(data) as HueDistrictKey[]) {
      result[key] = filterByTimeRange(data[key], timeRange);
    }
    return result;
  }, [timeRange]);
}
