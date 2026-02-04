/**
 * 爬蟲系統類型定義
 */

export interface ScrapedRate {
  bankId: string;
  bankName: string;
  currencyPair: string;
  fromCurrency: string;
  toCurrency: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  timestamp: number;
  source: string; // 數據來源 URL
}

export interface ScraperResult {
  success: boolean;
  bankId: string;
  rates: ScrapedRate[];
  error?: string;
  scrapedAt: number;
}

export interface BankScraper {
  bankId: string;
  bankName: string;
  url: string;
  scrape(): Promise<ScraperResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: ScrapedRate;
}

// InstantDB 寫入格式
export interface CurrentRateDB {
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

export interface HistoricalRateDB {
  id: string;
  bankId: string;
  currencyPair: string;
  buyPrice: number;
  sellPrice: number;
  date: string;
  hour: number;
  timestamp: number;
}
