import type { PricePoint } from '../types/market';
import propertyHistorical from '../data/property-historical.json';

interface PropertyEntry {
  date: string;
  pricePerSqm: number;
}

interface PropertyDataSet {
  hcm: PropertyEntry[];
  hanoi: PropertyEntry[];
  danang: PropertyEntry[];
  nhatrang: PropertyEntry[];
  phuquoc: PropertyEntry[];
}

const CITY_KEYS = ['hcm', 'hanoi', 'danang', 'nhatrang', 'phuquoc'] as const;
export type CityKey = (typeof CITY_KEYS)[number];

export type PropertyKey = CityKey | 'canuoc';

export function getPropertyData(): Record<PropertyKey, PricePoint[]> {
  const data = propertyHistorical as PropertyDataSet;
  const result = {} as Record<PropertyKey, PricePoint[]>;
  for (const key of CITY_KEYS) {
    result[key] = data[key].map((e) => ({ time: e.date, value: e.pricePerSqm }));
  }

  // Compute national average from all cities per date
  const dateMap = new Map<string, number[]>();
  for (const key of CITY_KEYS) {
    for (const entry of data[key]) {
      const arr = dateMap.get(entry.date) ?? [];
      arr.push(entry.pricePerSqm);
      dateMap.set(entry.date, arr);
    }
  }
  result.canuoc = Array.from(dateMap.entries())
    .map(([date, prices]) => ({
      time: date,
      value: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return result;
}
