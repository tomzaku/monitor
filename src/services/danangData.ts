import type { PricePoint } from '../types/market';
import danangDistricts from '../data/danang-districts.json';

interface Entry {
  date: string;
  pricePerSqm: number;
}

const DISTRICT_KEYS = ['haichau', 'sontra', 'hoaxuan', 'lienchieu', 'hoacuong'] as const;
export type DistrictKey = (typeof DISTRICT_KEYS)[number];

export function getDanangData(): Record<DistrictKey, PricePoint[]> {
  const data = danangDistricts as Record<DistrictKey, Entry[]>;
  const result = {} as Record<DistrictKey, PricePoint[]>;
  for (const key of DISTRICT_KEYS) {
    result[key] = data[key].map((e) => ({ time: e.date, value: e.pricePerSqm }));
  }
  return result;
}
