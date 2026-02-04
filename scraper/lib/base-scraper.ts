/**
 * 爬蟲基類
 * 提供通用的爬蟲功能和錯誤處理
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { ScrapedRate, ScraperResult, BankScraper } from './types';
import { validateRates, formatValidationReport } from './validator';

export interface ScraperConfig {
  bankId: string;
  bankName: string;
  url: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

/**
 * 爬蟲基類
 * 所有銀行爬蟲都應該繼承此類
 */
export abstract class BaseScraper implements BankScraper {
  protected config: Required<ScraperConfig>;
  protected browser?: Browser;
  protected context?: BrowserContext;
  protected page?: Page;

  constructor(config: ScraperConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config,
    };
  }

  get bankId(): string {
    return this.config.bankId;
  }

  get bankName(): string {
    return this.config.bankName;
  }

  get url(): string {
    return this.config.url;
  }

  /**
   * 初始化瀏覽器
   */
  protected async initBrowser(): Promise<void> {
    console.log(`🚀 初始化瀏覽器: ${this.config.bankName}`);
    
    this.browser = await chromium.launch({
      headless: true,
      timeout: this.config.timeout,
    });

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      locale: 'en-US',
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  /**
   * 關閉瀏覽器
   */
  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.context = undefined;
      this.page = undefined;
    }
  }

  /**
   * 訪問目標網頁
   */
  protected async navigateToPage(): Promise<void> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    console.log(`📡 訪問網站: ${this.config.url}`);
    await this.page.goto(this.config.url, { 
      waitUntil: 'networkidle',
      timeout: this.config.timeout,
    });
    
    // 等待頁面穩定
    await this.page.waitForTimeout(2000);
  }

  /**
   * 解析數字（子類可覆寫此方法以處理不同格式）
   */
  protected parseNumber(text: string): number | null {
    // 預設實現：移除所有非數字字符（除了小數點和負號）
    const cleaned = text.trim().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * 解析幣種代碼
   */
  protected parseCurrency(text: string): string | null {
    const normalized = text.toUpperCase().trim();
    
    const currencyMap: Record<string, string> = {
      'USD': 'USD', 'US': 'USD', 'DOLLAR': 'USD',
      'THB': 'THB', 'BAHT': 'THB',
      'CNY': 'CNY', 'YUAN': 'CNY', 'RMB': 'CNY',
      'EUR': 'EUR', 'EURO': 'EUR',
    };
    
    for (const [key, value] of Object.entries(currencyMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * 創建匯率對象
   */
  protected createRate(
    currency: string,
    buyPrice: number,
    sellPrice: number,
    timestamp: number = Date.now()
  ): ScrapedRate {
    return {
      bankId: this.config.bankId,
      bankName: this.config.bankName,
      currencyPair: `${currency}/LAK`,
      fromCurrency: currency,
      toCurrency: 'LAK',
      buyPrice,
      sellPrice,
      spread: sellPrice - buyPrice,
      timestamp,
      source: this.config.url,
    };
  }

  /**
   * 抽象方法：子類必須實現的爬取邏輯
   */
  protected abstract parseRates(): Promise<ScrapedRate[]>;

  /**
   * 主爬取方法（帶重試機制）
   */
  async scrape(): Promise<ScraperResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏦 開始爬取: ${this.config.bankName}`);
    console.log(`📍 URL: ${this.config.url}`);
    console.log(`${'='.repeat(60)}\n`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 重試第 ${attempt}/${this.config.retries} 次...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }

        // 初始化瀏覽器
        await this.initBrowser();

        // 訪問網頁
        await this.navigateToPage();

        // 解析數據（由子類實現）
        const rates = await this.parseRates();

        // 關閉瀏覽器
        await this.closeBrowser();

        // 驗證數據
        const { valid, invalid } = validateRates(rates);
        console.log(formatValidationReport(valid, invalid));

        if (valid.length === 0) {
          throw new Error('沒有有效的匯率數據');
        }

        console.log(`\n✅ ${this.config.bankName} 爬取成功: ${valid.length} 筆數據\n`);

        return {
          success: true,
          bankId: this.config.bankId,
          rates: valid,
          scrapedAt: Date.now(),
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`\n❌ 第 ${attempt} 次嘗試失敗:`, lastError.message);

        // 確保瀏覽器已關閉
        await this.closeBrowser();

        // 如果還有重試機會，繼續
        if (attempt < this.config.retries) {
          continue;
        }
      }
    }

    // 所有重試都失敗
    console.error(`\n❌ ${this.config.bankName} 爬取失敗（已重試 ${this.config.retries} 次）\n`);

    return {
      success: false,
      bankId: this.config.bankId,
      rates: [],
      error: lastError?.message || '未知錯誤',
      scrapedAt: Date.now(),
    };
  }
}
