// TypeScript 類型定義

export interface CurrentRate {
  id: string;
  bankId: string;
  bankName: string;
  currencyPair: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  percentChange24h: number;
  timestamp: number;
}

export interface HistoricalRate {
  id: string;
  bankId: string;
  currencyPair: string;
  buyPrice: number;
  sellPrice: number;
  date: string;
  hour: number;
  timestamp: number;
}

export interface Bank {
  id: string;
  bankId: string;
  name: string;
  fullName: string;
  website: string;
  logoUrl: string;
  isActive: boolean;
  priority: number;
}

export interface SupportedPair {
  id: string;
  pair: string;
  fromCurrency: string;
  toCurrency: string;
  displayName: string;
  isActive: boolean;
}

export interface FilterState {
  selectedPair: string;
  selectedBanks: string[];
  sortBy: 'buyPrice' | 'sellPrice' | 'spread' | 'change';
  sortOrder: 'asc' | 'desc';
}

export interface StatsData {
  bestBuyRate: CurrentRate | null;
  bestSellRate: CurrentRate | null;
  averageSpread: number;
  totalBanks: number;
}
