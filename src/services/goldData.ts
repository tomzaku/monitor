import type { PricePoint } from '../types/market';
import goldHistorical from '../data/gold-historical.json';

interface GoldEntry {
  date: string;
  buy: number;
  sell: number;
}

interface GoldDataSet {
  sjc: GoldEntry[];
  vang9999: GoldEntry[];
}

export function getGoldData(): { sjc: PricePoint[]; vang9999: PricePoint[] } {
  const data = goldHistorical as GoldDataSet;
  return {
    sjc: data.sjc.map((e) => ({ time: e.date, value: e.buy })),
    vang9999: data.vang9999.map((e) => ({ time: e.date, value: e.buy })),
  };
}

export function getLatestGoldPrices(): { sjcBuy: number; sjcSell: number; v9999Buy: number; v9999Sell: number } {
  const data = goldHistorical as GoldDataSet;
  const lastSjc = data.sjc[data.sjc.length - 1];
  const lastV9999 = data.vang9999[data.vang9999.length - 1];
  return {
    sjcBuy: lastSjc.buy,
    sjcSell: lastSjc.sell,
    v9999Buy: lastV9999.buy,
    v9999Sell: lastV9999.sell,
  };
}
