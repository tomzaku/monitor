import type { PricePoint } from '../types/market';
import hueDistricts from '../data/hue-districts.json';

interface Entry {
  date: string;
  pricePerSqm: number;
}

const DISTRICT_KEYS = ['trungtam', 'ancuu', 'kimlong', 'thuixuan', 'phuvang'] as const;
export type HueDistrictKey = (typeof DISTRICT_KEYS)[number];

export function getHueData(): Record<HueDistrictKey, PricePoint[]> {
  const data = hueDistricts as Record<HueDistrictKey, Entry[]>;
  const result = {} as Record<HueDistrictKey, PricePoint[]>;
  for (const key of DISTRICT_KEYS) {
    result[key] = data[key].map((e) => ({ time: e.date, value: e.pricePerSqm }));
  }
  return result;
}
