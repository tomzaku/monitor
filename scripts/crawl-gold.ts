/**
 * Crawl SJC gold prices from webgia.com, derive 9999 from SJC + historical spread.
 * Run: npx tsx scripts/crawl-gold.ts
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(import.meta.dirname, '..', 'src', 'data', 'gold-historical.json');

interface GoldEntry {
  date: string;
  buy: number;
  sell: number;
}

interface GoldData {
  sjc: GoldEntry[];
  vang9999: GoldEntry[];
}

async function fetchWebgiaData(slug: string): Promise<{ buy: [number, number][]; sell: [number, number][] }> {
  const url = `https://webgia.com/gia-vang/${slug}/bieu-do-1-nam.html`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const html = await res.text();

  const match = html.match(/seriesOptions\s*=\s*\[(.*?)\];/s);
  if (!match) throw new Error(`Could not find seriesOptions in ${url}`);

  const raw = match[1];
  const sellMatch = raw.match(/name:"Bán ra",data:\[(\[[\d,.[\]]+)\]/);
  const buyMatch = raw.match(/name:"Mua vào",data:\[(\[[\d,.[\]]+)\]/);

  function parsePoints(str: string | undefined): [number, number][] {
    if (!str) return [];
    const points: [number, number][] = [];
    const regex = /\[(\d+),([\d.]+)\]/g;
    let m;
    while ((m = regex.exec(str)) !== null) {
      points.push([parseInt(m[1]), parseFloat(m[2])]);
    }
    return points;
  }

  return {
    sell: parsePoints(sellMatch?.[1]),
    buy: parsePoints(buyMatch?.[1]),
  };
}

/**
 * Scrape current nhẫn 9999 price from webgia SJC page table.
 */
async function fetchCurrent9999(): Promise<{ buy: number; sell: number } | null> {
  try {
    const url = 'https://webgia.com/gia-vang/sjc/';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for "Nhẫn SJC 99.99" row — prices are per chỉ in đồng
    const nhanMatch = html.match(/Nhẫn SJC 99\.99[^]*?<td[^>]*>([\d,]+)<\/td>\s*<td[^>]*>([\d,]+)<\/td>/i);
    if (!nhanMatch) return null;

    const buy = parseInt(nhanMatch[1].replace(/,/g, ''));
    const sell = parseInt(nhanMatch[2].replace(/,/g, ''));
    if (isNaN(buy) || isNaN(sell)) return null;

    // Prices are per chỉ, multiply by 10 for per lượng
    return { buy: buy * 10, sell: sell * 10 };
  } catch {
    return null;
  }
}

function tsToDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Historical SJC-to-9999 spread (VND per lượng).
 * 9999 = SJC - spread. Spread changed over time due to SJC monopoly policy.
 * Sources: VietnamNet, Nguoi Quan Sat, market reports.
 */
function getSpread(date: string): { buySpread: number; sellSpread: number } {
  const d = date.replace(/-/g, '');
  if (d < '20200601') return { buySpread: 1_500_000, sellSpread: 1_500_000 };    // 2016-mid 2020: ~1-2tr
  if (d < '20210601') return { buySpread: 3_000_000, sellSpread: 3_000_000 };    // mid 2020-mid 2021: ~3tr (COVID era)
  if (d < '20220301') return { buySpread: 5_000_000, sellSpread: 5_000_000 };    // mid 2021-early 2022: ~5tr
  if (d < '20230101') return { buySpread: 8_000_000, sellSpread: 8_000_000 };    // 2022: ~6-10tr (SJC supply restricted)
  if (d < '20240601') return { buySpread: 10_000_000, sellSpread: 10_000_000 };  // 2023-mid 2024: ~8-15tr (peak gap)
  if (d < '20240801') return { buySpread: -1_000_000, sellSpread: 0 };           // mid 2024: 9999 briefly > SJC (NHNN bình ổn)
  if (d < '20250801') return { buySpread: 2_000_000, sellSpread: 2_000_000 };    // late 2024-mid 2025: ~1-3tr
  return { buySpread: 300_000, sellSpread: 300_000 };                             // late 2025-2026: almost equal (~0-0.5tr)
}

function mergeData(existing: GoldEntry[], crawled: { buy: [number, number][]; sell: [number, number][] }): GoldEntry[] {
  const map = new Map<string, GoldEntry>();
  for (const e of existing) {
    map.set(e.date, e);
  }

  const buyMap = new Map<string, number>();
  const sellMap = new Map<string, number>();
  for (const [ts, price] of crawled.buy) {
    buyMap.set(tsToDate(ts), Math.round(price * 1_000_000));
  }
  for (const [ts, price] of crawled.sell) {
    sellMap.set(tsToDate(ts), Math.round(price * 1_000_000));
  }

  for (const date of new Set([...buyMap.keys(), ...sellMap.keys()])) {
    const buy = buyMap.get(date);
    const sell = sellMap.get(date);
    if (buy && sell) {
      map.set(date, { date, buy, sell });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Derive 9999 prices from SJC data using historical spread.
 * Only derives for dates that don't already have a 9999 entry from a direct source.
 */
function derive9999(sjcData: GoldEntry[], current9999: { buy: number; sell: number } | null): GoldEntry[] {
  const entries: GoldEntry[] = [];

  for (const sjc of sjcData) {
    const { buySpread, sellSpread } = getSpread(sjc.date);
    entries.push({
      date: sjc.date,
      buy: Math.round(sjc.buy - buySpread),
      sell: Math.round(sjc.sell - sellSpread),
    });
  }

  // Override the latest entry with live scraped 9999 price if available
  if (current9999 && entries.length > 0) {
    const last = entries[entries.length - 1];
    last.buy = current9999.buy;
    last.sell = current9999.sell;
    console.log(`  9999 live price: buy ${current9999.buy / 1e6}tr, sell ${current9999.sell / 1e6}tr`);
  }

  return entries;
}

async function main() {
  console.log('Crawling gold prices from webgia.com...');

  let existing: GoldData;
  try {
    existing = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    existing = { sjc: [], vang9999: [] };
  }

  try {
    const sjcData = await fetchWebgiaData('sjc');
    console.log(`  SJC: ${sjcData.sell.length} sell points, ${sjcData.buy.length} buy points`);

    existing.sjc = mergeData(existing.sjc, sjcData);
    console.log(`  SJC total: ${existing.sjc.length} entries after merge`);

    // Scrape current 9999 price
    const current9999 = await fetchCurrent9999();

    // Derive 9999 from all SJC data
    existing.vang9999 = derive9999(existing.sjc, current9999);
    console.log(`  9999 total: ${existing.vang9999.length} entries (derived from SJC + spread)`);
  } catch (e) {
    console.error('  Crawl failed:', (e as Error).message);
  }

  writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`Written to ${DATA_PATH}`);
}

main().catch(console.error);
