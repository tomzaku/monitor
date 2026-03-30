/**
 * Crawl BTC-USD + Vietnamese ETFs from Yahoo Finance.
 * Stores max/1wk data as static JSON — eliminates allorigins.win proxy at runtime.
 * Run: npx tsx scripts/crawl-yahoo.ts
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data');

interface OHLCEntry {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceEntry {
  time: string;
  value: number;
}

interface YahooResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}

function tsToDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchYahoo(symbol: string, range: string, interval: string): Promise<YahooResponse> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
  });
  if (!res.ok) throw new Error(`Yahoo Finance ${symbol}: HTTP ${res.status}`);
  return res.json() as Promise<YahooResponse>;
}

function parseOHLC(data: YahooResponse, symbol: string): OHLCEntry[] {
  if (data.chart.error) throw new Error(`Yahoo Finance ${symbol}: ${data.chart.error.description}`);
  if (!data.chart.result?.length) throw new Error(`Yahoo Finance ${symbol}: no data`);

  const result = data.chart.result[0];
  const quote = result.indicators.quote[0];
  const entries: OHLCEntry[] = [];

  for (let i = 0; i < result.timestamp.length; i++) {
    const o = quote.open[i];
    const h = quote.high[i];
    const l = quote.low[i];
    const c = quote.close[i];
    if (o == null || h == null || l == null || c == null) continue;
    entries.push({
      time: tsToDate(result.timestamp[i]),
      open: Math.round(o * 100) / 100,
      high: Math.round(h * 100) / 100,
      low: Math.round(l * 100) / 100,
      close: Math.round(c * 100) / 100,
      volume: quote.volume[i] ?? undefined,
    });
  }

  // Deduplicate by date
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.time) ? false : seen.add(e.time)));
}

function parseLine(data: YahooResponse, symbol: string): PriceEntry[] {
  return parseOHLC(data, symbol).map((e) => ({ time: e.time, value: e.close }));
}

function mergeOHLC(existing: OHLCEntry[], fresh: OHLCEntry[]): OHLCEntry[] {
  const map = new Map(existing.map((e) => [e.time, e]));
  for (const e of fresh) map.set(e.time, e);
  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
}

function mergeLine(existing: PriceEntry[], fresh: PriceEntry[]): PriceEntry[] {
  const map = new Map(existing.map((e) => [e.time, e]));
  for (const e of fresh) map.set(e.time, e);
  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
}

function readJSON<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

async function crawlOHLC(symbol: string, filename: string) {
  const path = join(DATA_DIR, `${filename}.json`);
  const existing = readJSON<OHLCEntry[]>(path, []);
  const raw = await fetchYahoo(symbol, 'max', '1wk');
  const fresh = parseOHLC(raw, symbol);
  const merged = mergeOHLC(existing, fresh);
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  console.log(`  ${symbol}: ${merged.length} weekly entries → ${filename}.json`);
}

async function crawlLine(symbol: string, filename: string) {
  const path = join(DATA_DIR, `${filename}.json`);
  const existing = readJSON<PriceEntry[]>(path, []);
  const raw = await fetchYahoo(symbol, 'max', '1wk');
  const fresh = parseLine(raw, symbol);
  const merged = mergeLine(existing, fresh);
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  console.log(`  ${symbol}: ${merged.length} weekly entries → ${filename}.json`);
}

async function main() {
  console.log('Crawling Yahoo Finance data...');

  try {
    await crawlOHLC('BTC-USD', 'bitcoin-historical');
  } catch (e) {
    console.error('  BTC-USD failed:', (e as Error).message);
  }

  const etfs = [
    { symbol: 'E1VFVN30.VN', filename: 'etf-E1VFVN30-historical' },
    { symbol: 'FUESSV30.VN', filename: 'etf-FUESSV30-historical' },
    { symbol: 'FUEVFVND.VN', filename: 'etf-FUEVFVND-historical' },
  ];

  for (const { symbol, filename } of etfs) {
    try {
      await crawlLine(symbol, filename);
    } catch (e) {
      console.error(`  ${symbol} failed:`, (e as Error).message);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
