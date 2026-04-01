/**
 * Crawl batdongsan.com.vn listings for Da Nang and Đầm Sen areas.
 * Appends BDS listings to existing snapshot JSONs — run AFTER crawl-chotot.ts.
 *
 * Requires Chrome/Chromium. Override path with CHROME_PATH env var.
 *   macOS default: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
 *   Linux default: /usr/bin/google-chrome
 *
 * Run: npx tsx scripts/crawl-batdongsan.ts
 */

import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteerCore from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const puppeteer = addExtra(puppeteerCore as Parameters<typeof addExtra>[0]);
puppeteer.use(StealthPlugin());

const DANANG_LISTINGS_PATH = join(import.meta.dirname, '..', 'src', 'data', 'danang-listings.json');
const DAMSEN_LISTINGS_PATH = join(import.meta.dirname, '..', 'src', 'data', 'damsen-listings.json');

const CHROME_PATH =
  process.env.CHROME_PATH ??
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Listing {
  id: number;
  title: string;
  price: number;
  priceString: string;
  pricePerSqm: number;
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
  postedAt: number;
  lat?: number;
  lng?: number;
  block?: string;
}

// ---------------------------------------------------------------------------
// DOM card parser (BDS server-rendered HTML)
// ---------------------------------------------------------------------------

interface DomCard {
  prid: string;
  href: string;
  title: string;
  image: string;
  priceText: string;
  areaText: string;
  locationText: string;
  dateAriaLabel: string; // "DD/MM/YYYY" from aria-label
  typeText: string;
  pricePerM2Text: string;
  bedroomText: string;
  configTexts: string[];
}

/** Parse "3,5 tỷ", "500 triệu" → VND. Returns 0 if unparseable. */
function parsePriceVnd(text: string): number {
  if (!text) return 0;
  const t = text.toLowerCase().replace(/,/g, '.');
  const match = t.match(/([\d.]+)\s*(tỷ|triệu|tr|ty)/);
  if (!match) return 0;
  const v = parseFloat(match[1]);
  if (isNaN(v)) return 0;
  return match[2].startsWith('t') && match[2] !== 'triệu' && match[2] !== 'tr'
    ? Math.round(v * 1_000_000_000)   // tỷ
    : Math.round(v * 1_000_000);       // triệu
}

/** Parse "80 m²", "120m2" → m². Returns 0 if unparseable. */
function parseArea(text: string): number {
  if (!text) return 0;
  const match = text.replace(/,/g, '.').match(/([\d.]+)\s*m/i);
  return match ? parseFloat(match[1]) || 0 : 0;
}

/** Parse "62,5 triệu/m²" → triệu/m². */
function parsePricePerM2(text: string): number {
  if (!text) return 0;
  const t = text.toLowerCase().replace(/,/g, '.');
  const match = t.match(/([\d.]+)\s*triệu/);
  return match ? parseFloat(match[1]) || 0 : 0;
}

/** Parse "DD/MM/YYYY" or "DD/MM" → Unix ms timestamp. */
function parseBdsDate(text: string): number {
  if (!text) return 0;
  const match = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (!match) return 0;
  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
  return new Date(year, month, day).getTime();
}

function parseDomCard(c: DomCard): Listing | null {
  const id = parseInt(c.prid);
  if (!id || !c.title) return null;

  const url = c.href ? `https://batdongsan.com.vn${c.href}` : '';

  let priceText = c.priceText;
  if (!priceText) priceText = c.configTexts.find(t => /tỷ|triệu/i.test(t)) ?? '';
  const price = parsePriceVnd(priceText);

  let areaText = c.areaText;
  if (!areaText) areaText = c.configTexts.find(t => /m²|m2/i.test(t)) ?? '';
  const size = parseArea(areaText);

  if (size <= 0) return null;

  let pricePerSqm = parsePricePerM2(c.pricePerM2Text);
  if (pricePerSqm === 0 && price > 0 && size > 0) {
    pricePerSqm = Math.round((price / size / 1_000_000) * 10) / 10;
  }

  // Location: "Q. Sơn Trà (P. An Hải mới)" → district + ward
  const wardMatch = c.locationText.match(/\((.+?)\)/);
  const ward = wardMatch ? wardMatch[1] : '';
  const district = c.locationText.replace(/\s*\(.*?\)/, '').split(',')[0].trim();

  // Date: aria-label has "DD/MM/YYYY"
  const postedAt = parseBdsDate(c.dateAriaLabel);
  const d = postedAt ? new Date(postedAt) : null;
  const dateStr = d ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` : c.dateAriaLabel;

  const rooms = parseInt(c.bedroomText) || undefined;

  return {
    id,
    title: c.title.replace(/\s+/g, ' ').trim(),
    price,
    priceString: priceText,
    pricePerSqm,
    size,
    district,
    ward,
    street: '',
    category: c.typeText || 'Bất động sản',
    rooms,
    image: c.image,
    url,
    date: dateStr,
    postedAt,
  };
}

// ---------------------------------------------------------------------------
// Page scraper
// ---------------------------------------------------------------------------

async function scrapeListings(baseUrl: string, maxPages: number): Promise<Listing[]> {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ],
  });

  const allListings: Listing[] = [];

  try {
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const baseWithoutQuery = baseUrl.split('?')[0];
      const query = baseUrl.includes('?') ? baseUrl.slice(baseUrl.indexOf('?')) : '';
      const url = pageNum === 1 ? baseUrl : `${baseWithoutQuery}/p${pageNum}${query}`;
      console.log(`  Fetching page ${pageNum}: ${url}`);

      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'vi-VN,vi;q=0.9' });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.evaluate(() => window.scrollTo(0, 600));
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        console.log(`  Page ${pageNum} load failed: ${(err as Error).message}`);
        await page.close();
        break;
      }

      const rawCards = await page.evaluate(() => {
        const cards = document.querySelectorAll('.js__card[prid]');
        return Array.from(cards).map(card => {
          const link = card.querySelector('a.js__product-link-for-product-id') as HTMLAnchorElement | null;
          const priceEl = card.querySelector('.re__card-config-price');
          const areaEl = card.querySelector('.re__card-config-area');
          const locationEl = card.querySelector('.re__card-location span:not(.re__card-config-dot)');
          const dateEl = card.querySelector('.re__card-published-info-published-at');
          const typeEl = card.querySelector('.re__card-config-type');
          const pricePerM2El = card.querySelector('.re__card-config-price_per_m2');
          const bedroomEl = card.querySelector('.re__card-config-bedroom span');
          const imgEl = card.querySelector('img') as HTMLImageElement | null;
          return {
            prid: card.getAttribute('prid') ?? '',
            href: link?.getAttribute('href') ?? '',
            title: link?.getAttribute('title') ?? '',
            image: imgEl?.getAttribute('src') ?? imgEl?.getAttribute('data-img') ?? '',
            priceText: priceEl?.textContent?.trim() ?? '',
            areaText: areaEl?.textContent?.trim() ?? '',
            locationText: locationEl?.textContent?.trim() ?? '',
            dateAriaLabel: dateEl?.getAttribute('aria-label') ?? '',
            typeText: typeEl?.textContent?.trim() ?? '',
            pricePerM2Text: pricePerM2El?.textContent?.trim() ?? '',
            bedroomText: bedroomEl?.textContent?.trim() ?? '',
            configTexts: Array.from(card.querySelectorAll('.re__card-config-item span'))
              .map(el => el.textContent?.trim() ?? ''),
          };
        });
      }).catch(() => [] as DomCard[]);

      await page.close();

      const cardCount = (rawCards as DomCard[]).length;
      console.log(`  DOM cards: ${cardCount}`);

      if (cardCount === 0) break;

      const items = (rawCards as DomCard[])
        .map(c => parseDomCard(c))
        .filter((l): l is Listing => l !== null);

      console.log(`  Mapped: ${items.length}/${cardCount}`);
      allListings.push(...items);

      if (cardCount < 20) break;
    }
  } finally {
    await browser.close();
  }

  return allListings;
}

// ---------------------------------------------------------------------------
// File I/O + merge
// ---------------------------------------------------------------------------

function loadListings(path: string): Listing[] {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Listing[];
  } catch {
    return [];
  }
}

/**
 * Append fresh BDS listings to existing (chotot) listings.
 * Deduplicates by ID — existing entries win on collision.
 */
function mergeListings(existing: Listing[], fresh: Listing[]): Listing[] {
  const seenIds = new Set(existing.map(l => l.id));
  const newOnes = fresh.filter(l => !seenIds.has(l.id));
  return [...existing, ...newOnes];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Crawling batdongsan.com.vn listings...');
  console.log(`Chrome: ${CHROME_PATH}\n`);

  // Da Nang
  console.log('=== Da Nang Listings ===');
  const danangBds = await scrapeListings('https://batdongsan.com.vn/nha-dat-ban-da-nang', 6);
  console.log(`Found ${danangBds.length} BDS Da Nang listings`);

  if (danangBds.length > 0) {
    const existing = loadListings(DANANG_LISTINGS_PATH);
    const merged = mergeListings(existing, danangBds);
    writeFileSync(DANANG_LISTINGS_PATH, JSON.stringify(merged, null, 2) + '\n');
    console.log(`${existing.length} chotot + ${danangBds.length} BDS = ${merged.length} total → danang-listings.json`);
  }

  // Đầm Sen
  console.log('\n=== Đầm Sen Listings ===');
  const damsenBds = await scrapeListings(
    'https://batdongsan.com.vn/nha-dat-ban-da-nang?txt=%C4%91%E1%BA%A7m+sen',
    3
  );
  console.log(`Found ${damsenBds.length} BDS Đầm Sen listings`);

  if (damsenBds.length > 0) {
    const existing = loadListings(DAMSEN_LISTINGS_PATH);
    const merged = mergeListings(existing, damsenBds);
    writeFileSync(DAMSEN_LISTINGS_PATH, JSON.stringify(merged, null, 2) + '\n');
    console.log(`${existing.length} chotot + ${damsenBds.length} BDS = ${merged.length} total → damsen-listings.json`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
