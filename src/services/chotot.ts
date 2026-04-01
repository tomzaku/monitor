import danangListingsData from '../data/danang-listings.json';
import damsenListingsData from '../data/damsen-listings.json';

export interface ChototListing {
  id: number;
  title: string;
  price: number;
  priceString: string;
  pricePerSqm: number; // triệu/m²
  size: number;
  district: string;
  ward: string;
  street: string;
  category: string;
  floors?: number;
  rooms?: number;
  image: string;
  url: string;
  date: string;
  postedAt: number; // unix ms
  lat?: number;
  lng?: number;
  block?: string;
}

const danangListings = danangListingsData as ChototListing[];
const damsenListings = damsenListingsData as ChototListing[];

export type ListingSource = 'all' | 'chotot' | 'batdongsan';

export function getListingSource(listing: ChototListing): 'chotot' | 'batdongsan' {
  return listing.url.includes('batdongsan.com.vn') ? 'batdongsan' : 'chotot';
}

const CATEGORY_MAP: Record<string, string[]> = {
  house: ['Nhà ở', 'Nhà phố', 'Biệt thự', 'Nhà riêng'],
  land: ['Đất nền', 'Đất', 'Đất thổ cư'],
};

export function getDanangListings(category: 'all' | 'house' | 'land' = 'all'): ChototListing[] {
  if (category === 'all') return danangListings;
  const keywords = CATEGORY_MAP[category] ?? [];
  return danangListings.filter((l) => keywords.some((k) => l.category.includes(k)));
}

export function getDamSenListings(): ChototListing[] {
  return damsenListings;
}
