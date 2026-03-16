# Financial Monitor

React 19 + TypeScript + Vite dashboard monitoring gold (SJC/9999), BĐS (property), Bitcoin, and Vietnamese ETFs.

## Commands

- `npm run dev` — crawls gold data then starts Vite dev server
- `npm run build` — crawls gold data then builds for production
- `npm run crawl:gold` — standalone gold price crawl from webgia.com

## Data Files

All static data lives in `src/data/`:

- `gold-historical.json` — SJC + derived 9999 prices. SJC crawled from webgia.com, 9999 derived with historical spread.
- `property-historical.json` — avg price/m² per city (HCM, Hanoi, Đà Nẵng, Nha Trang, Phú Quốc)
- `danang-districts.json` — per-district prices (Hải Châu, Sơn Trà, Hòa Xuân, Liên Chiểu, Hòa Cường)
- `hue-districts.json` — per-district prices (Trung tâm, An Cựu, Kim Long, Thủy Xuân, Phú Vang)
- `events/*.json` — related news events per chart category (gold, property, danang, hue)

## Architecture

- Charts use TradingView `lightweight-charts` v5 (`chart.addSeries(LineSeries, ...)` API)
- Yahoo Finance data fetched via Vite proxy (dev) or allorigins.win (prod)
- React Query for API state management
- AI Adviser uses Claude API directly from browser (`anthropic-dangerous-direct-browser-access` header)
- Deployed to GitHub Pages at `/monitor/`

## Skills

- `/update-events` — Search web for latest news and add to events JSON files
