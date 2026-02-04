/**
 * APB (Agricultural Promotion Bank) 爬蟲
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class APBScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'APB',
      bankName: 'Agricultural Promotion Bank',
      url: 'https://www.apb.com.la/',
      timeout: 45000, // APB 網站可能較慢
    });
    
    this.logger = new Logger('APB');
  }

  /**
   * 解析 APB 匯率數據
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // APB 網站可能需要更長時間加載
    await this.page.waitForTimeout(5000);

    // 尋找匯率相關的連結或區域
    const exchangeSelectors = [
      'text=匯率',
      'text=Exchange',
      'text=Rate',
      '[href*="exchange"]',
      '[href*="rate"]',
    ];

    for (const selector of exchangeSelectors) {
      try {
        const link = await this.page.$(selector);
        if (link) {
          await link.click();
          await this.page.waitForTimeout(3000);
          this.logger.info(`已點擊連結: ${selector}`);
          break;
        }
      } catch (error) {
        // 繼續嘗試
      }
    }

    // 查找表格
    const tables = await this.page.$$('table');
    this.logger.info(`找到 ${tables.length} 個表格`);

    if (tables.length === 0) {
      this.logger.warning('網站上未找到表格，嘗試其他方式提取數據');
      
      // 如果沒有表格，嘗試從頁面文本中提取
      const content = await this.page.content();
      
      // 尋找可能包含匯率的文本模式
      for (const currency of TARGET_CURRENCIES) {
        const patterns = [
          new RegExp(`${currency}[\\s\\S]{0,100}?(\\d{1,3}[,.]?\\d{3}[,.]?\\d{0,2})[\\s\\S]{0,50}?(\\d{1,3}[,.]?\\d{3}[,.]?\\d{0,2})`, 'i'),
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1] && match[2]) {
            const buyPrice = this.parseNumber(match[1]);
            const sellPrice = this.parseNumber(match[2]);
            
            if (buyPrice && sellPrice && sellPrice > buyPrice) {
              const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
              rates.push(rate);
              this.logger.success(`從文本提取: ${rate.currencyPair}`);
              break;
            }
          }
        }
      }

      return rates;
    }

    // 解析表格
    const rows = await this.page.$$('table tr, table tbody tr');
    this.logger.info(`找到 ${rows.length} 行數據`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td, th');
      
      if (cells.length < 3) continue;

      const cellTexts = await Promise.all(
        cells.map(cell => cell.textContent())
      );

      const cleanedTexts = cellTexts.map(t => t?.trim() || '');

      // 尋找幣種
      let currencyIndex = -1;
      let currency: string | null = null;

      for (let j = 0; j < cleanedTexts.length; j++) {
        currency = this.parseCurrency(cleanedTexts[j]);
        if (currency && TARGET_CURRENCIES.includes(currency)) {
          currencyIndex = j;
          break;
        }
      }

      if (currencyIndex === -1 || !currency) {
        continue;
      }

      // 假設買入和賣出在幣種後面
      const buyPriceText = cleanedTexts[currencyIndex + 1] || '';
      const sellPriceText = cleanedTexts[currencyIndex + 2] || '';

      const buyPrice = this.parseNumber(buyPriceText);
      const sellPrice = this.parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        this.logger.warning(`無法解析價格: ${currency} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
      rates.push(rate);
      this.logger.success(`解析成功: ${rate.currencyPair} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
    }

    return rates;
  }
}

// 導出爬取函數
export async function scrapeAPB() {
  const scraper = new APBScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeAPB()
    .then(result => {
      console.log('\n=== 爬取結果 ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('執行錯誤:', error);
      process.exit(1);
    });
}
