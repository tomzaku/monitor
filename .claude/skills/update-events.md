---
name: update-events
description: Search for latest news/events that affect gold prices, property prices (BĐS), or Bitcoin, then add them to the events data files.
user_invocable: true
---

# Update Related Events Data

This skill searches the web for recent news affecting asset prices in Vietnam and adds new events to the JSON data files in `src/data/events/`.

## Event Data Files

- `src/data/events/gold.json` — Gold (SJC, 9999) price-affecting events
- `src/data/events/property.json` — National property market events (HCM, Hanoi, Đà Nẵng, Phú Quốc)
- `src/data/events/danang.json` — Đà Nẵng-specific BĐS events
- `src/data/events/hue.json` — Huế-specific BĐS events

## Event JSON Schema

Each event file is a JSON array of objects:

```json
{
  "date": "YYYY-MM-DD",
  "title": "Short title in Vietnamese (max 60 chars)",
  "impact": "positive" | "negative" | "neutral",
  "detail": "1-2 sentence description in Vietnamese with specific numbers",
  "url": "https://source-article-url"
}
```

## Steps

1. **Ask the user** which category to update: gold, property, danang, hue, or all.

2. **Search the web** for recent Vietnamese news using queries like:
   - Gold: `giá vàng SJC 9999 hôm nay tuần này biến động`
   - Property: `thị trường bất động sản Việt Nam tin mới nhất`
   - Đà Nẵng: `bất động sản Đà Nẵng tin mới Hòa Xuân Sơn Trà`
   - Huế: `bất động sản Huế TPTTTW tin mới`

3. **For each relevant article found:**
   - Extract the date, headline, key numbers
   - Determine impact: `positive` (price increase, demand up, good policy), `negative` (price drop, crash, bad policy), `neutral` (informational, mixed)
   - Write a concise Vietnamese detail with specific data points (prices, percentages)
   - Include the source URL

4. **Read the existing events file** for the category.

5. **Check for duplicates** — don't add events with the same date + similar title.

6. **Add new events** at the beginning of the array (newest first). Keep the array sorted by date descending.

7. **Write the updated file** back. Keep events from the last 2 years maximum. Remove older events.

8. **Report** what was added: number of new events, their dates and titles.

## Quality Rules

- Only add events with verifiable source URLs
- Include specific numbers in detail (e.g., "giảm 2.5tr/lượng" not just "giảm")
- impact must accurately reflect the event's effect on prices
- Don't add duplicate or near-duplicate events
- Vietnamese language for title and detail
- Dates must be in YYYY-MM-DD format
