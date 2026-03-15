import { useMemo } from 'react';
import { getPropertyData, type PropertyKey } from '../services/propertyData';
import type { PricePoint, TimeRange } from '../types/market';
import { subMonths, subYears } from 'date-fns';

export function filterByTimeRange(data: PricePoint[], timeRange: TimeRange): PricePoint[] {
  if (timeRange === 'ALL') return data;

  const now = new Date();
  let cutoff: Date;
  switch (timeRange) {
    case '1M': cutoff = subMonths(now, 1); break;
    case '3M': cutoff = subMonths(now, 3); break;
    case '6M': cutoff = subMonths(now, 6); break;
    case '1Y': cutoff = subYears(now, 1); break;
    case '5Y': cutoff = subYears(now, 5); break;
  }

  return data.filter((d) => new Date(d.time) >= cutoff);
}

export function usePropertyPrice(timeRange: TimeRange) {
  return useMemo(() => {
    const data = getPropertyData();
    const result = {} as Record<PropertyKey, PricePoint[]>;
    for (const key of Object.keys(data) as PropertyKey[]) {
      result[key] = filterByTimeRange(data[key], timeRange);
    }
    return result;
  }, [timeRange]);
}
