const API_BASE = import.meta.env.DEV
  ? '/api/chotot/v1/public/ad-listing'
  : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://gateway.chotot.com/v1/public/ad-listing');

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
  block?: string; // parsed block code, e.g. "B2-114"
}

interface ChototAd {
  ad_id: number;
  list_id: number;
  subject: string;
  price: number;
  price_string: string;
  price_million_per_m2?: number;
  size: number;
  area_name: string;
  ward_name: string;
  street_name?: string;
  category_name: string;
  floors?: number;
  rooms?: number;
  image: string;
  date: string;
  list_time: number;
  latitude?: number;
  longitude?: number;
  area_v2: number;
}

// Da Nang proper = area_v2 starting with 3017
const DANANG_AREA_PREFIX = '3017';

function buildUrl(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  );

  if (import.meta.env.DEV) {
    return `${API_BASE}?${searchParams}`;
  }

  // Prod: encode full URL for allorigins proxy
  const fullUrl = `https://gateway.chotot.com/v1/public/ad-listing?${searchParams}`;
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`;
}

export async function fetchDanangListings(category: 'all' | 'house' | 'land' = 'all'): Promise<ChototListing[]> {
  const cgMap = { all: '1000', house: '1020', land: '1040' };

  const allAds: ChototAd[] = [];
  const limit = 50;
  const maxPages = 6; // up to 300 listings

  for (let page = 0; page < maxPages; page++) {
    const url = buildUrl({
      cg: cgMap[category],
      st: 's,k',
      region: 3,
      limit,
      o: page * limit,
    });

    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const ads: ChototAd[] = data.ads || [];
      if (ads.length === 0) break;

      // Filter to Da Nang proper (exclude Quang Nam)
      for (const ad of ads) {
        if (String(ad.area_v2).startsWith(DANANG_AREA_PREFIX)) {
          allAds.push(ad);
        }
      }

      if (ads.length < limit) break;
    } catch {
      break;
    }
  }

  return allAds
    .filter(ad => ad.price > 0 && ad.size > 0 && ad.price_million_per_m2 && ad.price_million_per_m2 > 0)
    .map(mapAd);
}

function parseBlock(title: string): string | undefined {
  const m = title.match(/\bB[23]-\d+\b/i);
  return m ? m[0].toUpperCase() : undefined;
}

function mapAd(ad: ChototAd): ChototListing {
  const title = ad.subject.replace(/[✨📍🏡☎️📲🌟💵🔥🏠✅]/g, '').trim();
  return {
    id: ad.ad_id,
    title,
    price: ad.price,
    priceString: ad.price_string,
    pricePerSqm: Math.round(ad.price_million_per_m2! * 10) / 10,
    size: ad.size,
    district: ad.area_name,
    ward: ad.ward_name,
    street: ad.street_name || '',
    category: ad.category_name,
    floors: ad.floors,
    rooms: ad.rooms,
    image: ad.image,
    url: `https://www.nhatot.com/${ad.list_id}.htm`,
    date: ad.date,
    postedAt: ad.list_time,
    lat: ad.latitude,
    lng: ad.longitude,
    block: parseBlock(ad.subject),
  };
}

export async function fetchDamSenListings(): Promise<ChototListing[]> {
  const allAds: ChototAd[] = [];
  const limit = 50;
  const maxPages = 4;

  for (let page = 0; page < maxPages; page++) {
    const url = buildUrl({
      cg: '1000',
      st: 's,k',
      region: 3,
      q: 'đầm sen',
      limit,
      o: page * limit,
    });

    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const ads: ChototAd[] = data.ads || [];
      if (ads.length === 0) break;
      allAds.push(...ads);
      if (ads.length < limit) break;
    } catch {
      break;
    }
  }

  return allAds
    .filter(ad => ad.price > 0 && ad.size > 0 && ad.price_million_per_m2 && ad.price_million_per_m2 > 0)
    .map(ad => mapAd(ad));
}
