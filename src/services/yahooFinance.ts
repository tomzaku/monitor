import type { OHLCData, PricePoint } from '../types/market';

interface YahooChartResult {
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
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: { code: string; description: string } | null;
  };
}

// Request queue to serialize Yahoo Finance calls and avoid 429s
const queue: Array<() => void> = [];
let running = false;
const DELAY_MS = 1200; // 1.2s between requests

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
    processQueue();
  });
}

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
    if (queue.length > 0) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  running = false;
}

function getYahooUrl(symbol: string, range: string, interval: string): string {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  if (import.meta.env.DEV) {
    // In dev, use Vite proxy
    return `/api/yahoo${path}`;
  }
  // In production, use allorigins proxy to bypass CORS
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query2.finance.yahoo.com${path}`)}`;
}

async function rawFetchOHLC(
  symbol: string,
  range: string,
  interval: string,
): Promise<OHLCData[]> {
  const url = getYahooUrl(symbol, range, interval);
  const res = await fetch(url);

  if (res.status === 429) {
    throw new Error('Rate limited by Yahoo Finance. Please wait a moment and try again.');
  }
  if (!res.ok) throw new Error(`Yahoo Finance API error: ${res.status}`);

  const data: YahooChartResponse = await res.json();
  if (data.chart.error) throw new Error(data.chart.error.description);
  if (!data.chart.result?.length) throw new Error('No data returned');

  const result = data.chart.result[0];
  const quote = result.indicators.quote[0];
  const points: OHLCData[] = [];

  for (let i = 0; i < result.timestamp.length; i++) {
    const o = quote.open[i];
    const h = quote.high[i];
    const l = quote.low[i];
    const c = quote.close[i];
    if (o == null || h == null || l == null || c == null) continue;

    const date = new Date(result.timestamp[i] * 1000);
    const time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    points.push({ time, open: o, high: h, low: l, close: c, volume: quote.volume[i] ?? undefined });
  }

  // Deduplicate by time (Yahoo sometimes returns duplicate timestamps)
  const seen = new Set<string>();
  const deduped: OHLCData[] = [];
  for (const p of points) {
    if (!seen.has(p.time)) {
      seen.add(p.time);
      deduped.push(p);
    }
  }

  return deduped;
}

export function fetchOHLC(
  symbol: string,
  range: string,
  interval: string,
): Promise<OHLCData[]> {
  return enqueue(() => rawFetchOHLC(symbol, range, interval));
}

export async function fetchLineData(
  symbol: string,
  range: string,
  interval: string,
): Promise<PricePoint[]> {
  const ohlc = await fetchOHLC(symbol, range, interval);
  return ohlc.map((d) => ({ time: d.time, value: d.close }));
}
