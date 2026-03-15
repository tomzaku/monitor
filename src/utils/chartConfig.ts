import type { DeepPartial, ChartOptions, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';

export const darkChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: '#1a1a2e' },
    textColor: '#e0e0e0',
    fontSize: 12,
  },
  grid: {
    vertLines: { color: '#16213e' },
    horzLines: { color: '#16213e' },
  },
  crosshair: {
    vertLine: {
      color: '#758696',
      style: 2,
      width: 1,
    },
    horzLine: {
      color: '#758696',
      style: 2,
      width: 1,
    },
  },
  timeScale: {
    borderColor: '#2a2a4a',
    timeVisible: false,
  },
  rightPriceScale: {
    borderColor: '#2a2a4a',
  },
};

export const candlestickColors = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
};

export const lineColors = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  blue: '#4fc3f7',
  green: '#26a69a',
  red: '#ef5350',
  orange: '#ff9800',
  purple: '#ab47bc',
  cyan: '#00bcd4',
};

export const defaultLineStyle: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 4,
};
