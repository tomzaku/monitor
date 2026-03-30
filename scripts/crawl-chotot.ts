/**
 * Crawl real estate price data from Cho Tot (nhatot.com) API.
 * Calculates median price/m² for cities and districts.
 * Run: npx tsx scripts/crawl-chotot.ts
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const PROPERTY_PATH = join(import.meta.dirname, '..', 'src', 'data', 'property-historical.json');
const DANANG_PATH = join(import.meta.dirname, '..', 'src', 'data', 'danang-districts.json');
const HUE_PATH = join(import.meta.dirname, '..', 'src', 'data', 'hue-districts.json');
const DANANG_LISTINGS_PATH = join(import.meta.dirname, '..', 'src', 'data', 'danang-listings.json');
const DAMSEN_LISTINGS_PATH = join(import.meta.dirname, '..', 'src', 'data', 'damsen-listings.json');

const API_BASE = 'https://gateway.chotot.com/v1/public/ad-listing';

// Chotot region codes
const REGIONS = {
  hcm: { region: 13 },
  hanoi: { region: 12 },
  danang: { region: 3, areaPrefix: '3017' }, // 3017XX = Da Nang proper
  nhatrang: { region: 7, area_v2: 704401 },
  phuquoc: { region: 5, area_v2: 503112 },
} as const;

// Da Nang district area_v2 codes
const DANANG_DISTRICTS = {
  haichau: 301703,
  sontra: 301704,
  hoaxuan: 301706, // Cẩm Lệ district (includes Hòa Xuân ward)
  lienchieu: 301701,
  hoacuong: 301705, // Ngũ Hành Sơn (Hòa Cường is actually in Hải Châu, but we use NHS as the 5th district)
} as const;

// Hue area code (TP Huế only — wards not available via API)
const HUE_CITY_AREA = 604001;

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
  region: number;
}

interface PropertyEntry {
  date: string;
  pricePerSqm: number;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Fetch listings from Chotot API with pagination.
 * Returns all ads with valid price_million_per_m2.
 */
async function fetchListings(params: Record<string, string | number>, category = '1000', maxPages = 10): Promise<ChototAd[]> {
  const allAds: ChototAd[] = [];
  const limit = 50;

  for (let page = 0; page < maxPages; page++) {
    const searchParams = new URLSearchParams({
      cg: category, // 1000=all BDS, 1010=apartments
      st: 's,k',  // sell listings
      limit: String(limit),
      o: String(page * limit),
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });

    const url = `${API_BASE}?${searchParams}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      if (!res.ok) break;

      const data = await res.json();
      const ads = data.ads || [];
      if (ads.length === 0) break;

      for (const ad of ads) {
        if (ad.price_million_per_m2 && ad.price_million_per_m2 > 0 && ad.size > 0) {
          allAds.push(ad);
        }
      }

      if (ads.length < limit) break;
    } catch {
      break;
    }
  }

  return allAds;
}

/**
 * Calculate median of an array of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate median price/m² from ads, converting from triệu/m² to VND/m².
 * Filters outliers (below 1tr and above 500tr per m²).
 */
function medianPricePerSqm(ads: ChototAd[]): number | null {
  const prices = ads
    .map(a => a.price_million_per_m2!)
    .filter(p => p >= 1 && p <= 500); // Filter outliers

  if (prices.length < 3) return null; // Need at least 3 data points

  const med = median(prices);
  return Math.round(med * 1_000_000); // Convert triệu → VND
}

function loadJSON(path: string): Record<string, PropertyEntry[]> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function appendEntry(entries: PropertyEntry[], date: string, pricePerSqm: number): PropertyEntry[] {
  // Remove existing entry for today if any
  const filtered = entries.filter(e => e.date !== date);
  filtered.push({ date, pricePerSqm });
  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

async function crawlCityPrices(): Promise<Record<string, number | null>> {
  const results: Record<string, number | null> = {};

  // Use cg=1010 (apartments only) for city-level data — matches historical data better
  const APT = '1010';

  // HCM
  console.log('  Crawling HCM (apartments)...');
  const hcmAds = await fetchListings({ region: REGIONS.hcm.region }, APT);
  results.hcm = medianPricePerSqm(hcmAds);
  console.log(`    HCM: ${hcmAds.length} ads, median ${results.hcm ? (results.hcm / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);

  // Hanoi
  console.log('  Crawling Hanoi (apartments)...');
  const hanoiAds = await fetchListings({ region: REGIONS.hanoi.region }, APT);
  results.hanoi = medianPricePerSqm(hanoiAds);
  console.log(`    Hanoi: ${hanoiAds.length} ads, median ${results.hanoi ? (results.hanoi / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);

  // Da Nang (apartments, only 3017XX area codes = Da Nang proper)
  console.log('  Crawling Da Nang (apartments)...');
  const dnAllAds = await fetchListings({ region: REGIONS.danang.region }, APT);
  const dnAds = dnAllAds.filter(a => String(a.area_v2).startsWith(REGIONS.danang.areaPrefix));
  results.danang = medianPricePerSqm(dnAds);
  console.log(`    Da Nang: ${dnAds.length} ads (of ${dnAllAds.length}), median ${results.danang ? (results.danang / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);

  // Nha Trang (apartments)
  console.log('  Crawling Nha Trang (apartments)...');
  const ntAds = await fetchListings({ region: REGIONS.nhatrang.region, area_v2: REGIONS.nhatrang.area_v2 }, APT);
  results.nhatrang = medianPricePerSqm(ntAds);
  console.log(`    Nha Trang: ${ntAds.length} ads, median ${results.nhatrang ? (results.nhatrang / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);

  // Phu Quoc (apartments)
  console.log('  Crawling Phu Quoc (apartments)...');
  const pqAds = await fetchListings({ region: REGIONS.phuquoc.region, area_v2: REGIONS.phuquoc.area_v2 }, APT);
  results.phuquoc = medianPricePerSqm(pqAds);
  console.log(`    Phu Quoc: ${pqAds.length} ads, median ${results.phuquoc ? (results.phuquoc / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);

  return results;
}

async function crawlDanangDistricts(): Promise<Record<string, number | null>> {
  const results: Record<string, number | null> = {};

  for (const [name, areaCode] of Object.entries(DANANG_DISTRICTS)) {
    console.log(`  Crawling Da Nang - ${name} (${areaCode})...`);
    const ads = await fetchListings({ region: 3, area_v2: areaCode });
    results[name] = medianPricePerSqm(ads);
    console.log(`    ${name}: ${ads.length} ads, median ${results[name] ? (results[name]! / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);
  }

  return results;
}

async function crawlHueCity(): Promise<number | null> {
  console.log(`  Crawling Hue city (${HUE_CITY_AREA})...`);
  const ads = await fetchListings({ region: 6, area_v2: HUE_CITY_AREA });
  const result = medianPricePerSqm(ads);
  console.log(`    Hue: ${ads.length} ads, median ${result ? (result / 1e6).toFixed(1) + 'tr/m²' : 'N/A'}`);
  return result;
}

// --- Listing snapshots ---

function parseBlock(title: string): string | undefined {
  const m = title.match(/\bB[23]-\d+\b/i);
  return m ? m[0].toUpperCase() : undefined;
}

function mapAdToListing(ad: ChototAd) {
  const title = ad.subject
    .replace(/[\uD800-\uDFFF]/g, '')  // remove surrogates (emoji + lone surrogates)
    .replace(/\s+/g, ' ')
    .trim();
  return {
    id: ad.ad_id,
    title,
    price: ad.price,
    priceString: ad.price_string,
    pricePerSqm: Math.round((ad.price_million_per_m2 ?? 0) * 10) / 10,
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

const DANANG_AREA_PREFIX = '3017';

async function snapshotDanangListings() {
  console.log('  Snapshotting Da Nang listings...');
  const allAds: ChototAd[] = [];
  const limit = 50;

  for (let page = 0; page < 6; page++) {
    const params = new URLSearchParams({ cg: '1000', st: 's,k', region: '3', limit: String(limit), o: String(page * limit) });
    try {
      const res = await fetch(`${API_BASE}?${params}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) break;
      const data = await res.json();
      const ads: ChototAd[] = data.ads || [];
      if (ads.length === 0) break;
      for (const ad of ads) {
        if (String(ad.area_v2).startsWith(DANANG_AREA_PREFIX) && ad.price > 0 && ad.size > 0 && ad.price_million_per_m2) {
          allAds.push(ad);
        }
      }
      if (ads.length < limit) break;
    } catch { break; }
  }

  const listings = allAds.map(mapAdToListing);
  writeFileSync(DANANG_LISTINGS_PATH, JSON.stringify(listings, null, 2) + '\n');
  console.log(`    ${listings.length} Da Nang listings → danang-listings.json`);
}

async function snapshotDamSenListings() {
  console.log('  Snapshotting Đầm Sen listings...');
  const allAds: ChototAd[] = [];
  const limit = 50;

  for (let page = 0; page < 4; page++) {
    const params = new URLSearchParams({ cg: '1000', st: 's,k', region: '3', q: 'đầm sen', limit: String(limit), o: String(page * limit) });
    try {
      const res = await fetch(`${API_BASE}?${params}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) break;
      const data = await res.json();
      const ads: ChototAd[] = data.ads || [];
      if (ads.length === 0) break;
      allAds.push(...ads.filter((a: ChototAd) => a.price > 0 && a.size > 0 && a.price_million_per_m2));
      if (ads.length < limit) break;
    } catch { break; }
  }

  const listings = allAds.map(mapAdToListing);
  writeFileSync(DAMSEN_LISTINGS_PATH, JSON.stringify(listings, null, 2) + '\n');
  console.log(`    ${listings.length} Đầm Sen listings → damsen-listings.json`);
}

async function main() {
  const date = today();
  console.log(`Crawling Cho Tot real estate data for ${date}...\n`);

  // --- City prices ---
  console.log('=== City Prices ===');
  const cityPrices = await crawlCityPrices();

  const propertyData = loadJSON(PROPERTY_PATH);
  let cityUpdated = 0;
  for (const [city, price] of Object.entries(cityPrices)) {
    if (price && propertyData[city]) {
      propertyData[city] = appendEntry(propertyData[city], date, price);
      cityUpdated++;
    }
  }

  if (cityUpdated > 0) {
    writeFileSync(PROPERTY_PATH, JSON.stringify(propertyData, null, 2) + '\n');
    console.log(`\nUpdated ${cityUpdated} cities in ${PROPERTY_PATH}`);
  } else {
    console.log('\nNo city data to update (insufficient listings)');
  }

  // --- Da Nang districts ---
  console.log('\n=== Da Nang Districts ===');
  const dnPrices = await crawlDanangDistricts();

  const danangData = loadJSON(DANANG_PATH);
  let dnUpdated = 0;
  for (const [district, price] of Object.entries(dnPrices)) {
    if (price && danangData[district]) {
      danangData[district] = appendEntry(danangData[district], date, price);
      dnUpdated++;
    }
  }

  if (dnUpdated > 0) {
    writeFileSync(DANANG_PATH, JSON.stringify(danangData, null, 2) + '\n');
    console.log(`Updated ${dnUpdated} Da Nang districts in ${DANANG_PATH}`);
  } else {
    console.log('No Da Nang district data to update (insufficient listings)');
  }

  // --- Hue ---
  console.log('\n=== Hue ===');
  const huePrice = await crawlHueCity();

  if (huePrice) {
    const hueData = loadJSON(HUE_PATH);
    // Update trungtam (city center) with the TP Hue median
    if (hueData.trungtam) {
      hueData.trungtam = appendEntry(hueData.trungtam, date, huePrice);
      writeFileSync(HUE_PATH, JSON.stringify(hueData, null, 2) + '\n');
      console.log(`Updated Hue trungtam in ${HUE_PATH}`);
    }
  } else {
    console.log('No Hue data to update (insufficient listings)');
  }

  // --- Listing snapshots ---
  console.log('\n=== Listing Snapshots ===');
  await snapshotDanangListings();
  await snapshotDamSenListings();

  console.log('\nDone!');
}

main().catch(console.error);
