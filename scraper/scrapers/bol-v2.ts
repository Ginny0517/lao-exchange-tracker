/**
 * Bank of Laos (BOL) 爬蟲 - 使用基類重構版本
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class BOLScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'BOL',
      bankName: 'Bank of Laos',
      url: 'https://bol.gov.la/ExchangRate.php',
    });
    
    this.logger = new Logger('BOL');
  }

  /**
   * BOL 使用歐洲數字格式：
   * - 句點 (.) 作為千分位分隔符
   * - 逗號 (,) 作為小數點
   */
  protected parseNumber(text: string): number | null {
    let cleaned = text.trim().replace(/\s/g, '');
    
    if (!cleaned) return null;
    
    // 處理歐洲格式
    if (cleaned.includes('.') && cleaned.includes(',')) {
      // 如 "1.234,56" - 移除句點，將逗號替換為句點
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.')) {
      const dotIndex = cleaned.lastIndexOf('.');
      const afterDot = cleaned.substring(dotIndex + 1);
      
      // 如果句點後有 3 位數字，是千分位（如 "21.409"）
      if (afterDot.length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    } else if (cleaned.includes(',')) {
      // 只有逗號，是小數點（如 "675,85"）
      cleaned = cleaned.replace(',', '.');
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * 解析 BOL 匯率數據
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // 獲取頁面 HTML
    const html = await this.page.content();
    this.logger.info(`頁面 HTML 長度: ${html.length} 字符`);

    // 查找表格
    const tables = await this.page.$$('table');
    this.logger.info(`找到 ${tables.length} 個表格`);

    if (tables.length === 0) {
      throw new Error('無法找到匯率表格');
    }

    // 解析表格行
    const rows = await this.page.$$('table tr, table tbody tr');
    this.logger.info(`找到 ${rows.length} 行數據`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td, th');
      
      if (cells.length < 6) continue;

      const cellTexts = await Promise.all(
        cells.map(cell => cell.textContent())
      );

      // BOL 表格結構：序號, 國家, 幣種名稱, 幣種代碼, 買入價, 賣出價
      const currencyCode = cellTexts[3]?.trim() || '';
      const currency = this.parseCurrency(currencyCode);

      // 只處理目標幣種
      if (!currency || !TARGET_CURRENCIES.includes(currency)) {
        continue;
      }

      const buyPriceText = cellTexts[4]?.trim() || '';
      const sellPriceText = cellTexts[5]?.trim() || '';

      const buyPrice = this.parseNumber(buyPriceText);
      const sellPrice = this.parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        this.logger.warning(`無法解析價格: ${currencyCode} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
      rates.push(rate);
      this.logger.success(`解析成功: ${rate.currencyPair} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
    }

    return rates;
  }
}

// 導出爬取函數（向後兼容）
export async function scrapeBOL() {
  const scraper = new BOLScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeBOL()
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
