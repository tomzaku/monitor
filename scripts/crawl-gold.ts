/**
 * Crawl SJC gold prices from webgia.com and update the static JSON file.
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

  // Extract seriesOptions from embedded JS
  const match = html.match(/seriesOptions\s*=\s*\[(.*?)\];/s);
  if (!match) throw new Error(`Could not find seriesOptions in ${url}`);

  const raw = match[1];

  // Parse sell series (Bán ra)
  const sellMatch = raw.match(/name:"Bán ra",data:\[(\[[\d,.[\]]+)\]/);
  // Parse buy series (Mua vào)
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

function tsToDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mergeData(existing: GoldEntry[], crawled: { buy: [number, number][]; sell: [number, number][] }): GoldEntry[] {
  // Build a map of existing entries by date
  const map = new Map<string, GoldEntry>();
  for (const e of existing) {
    map.set(e.date, e);
  }

  // Merge crawled data (prices are in millions, convert to VND)
  const buyMap = new Map<string, number>();
  const sellMap = new Map<string, number>();
  for (const [ts, price] of crawled.buy) {
    buyMap.set(tsToDate(ts), Math.round(price * 1_000_000));
  }
  for (const [ts, price] of crawled.sell) {
    sellMap.set(tsToDate(ts), Math.round(price * 1_000_000));
  }

  // Add/update entries from crawled data
  for (const date of new Set([...buyMap.keys(), ...sellMap.keys()])) {
    const buy = buyMap.get(date);
    const sell = sellMap.get(date);
    if (buy && sell) {
      map.set(date, { date, buy, sell });
    }
  }

  // Sort by date
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  console.log('Crawling SJC gold prices from webgia.com...');

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
  } catch (e) {
    console.error('  SJC crawl failed:', (e as Error).message);
  }

  writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`Written to ${DATA_PATH}`);
}

main().catch(console.error);
