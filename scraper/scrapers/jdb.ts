/**
 * JDB (Joint Development Bank) 爬蟲
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class JDBScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'JDB',
      bankName: 'Joint Development Bank',
      // 直接訪問 iframe 中的實際匯率頁面
      url: 'https://www.jdbbank.com.la/exchange/exchange_all.php',
    });
    
    this.logger = new Logger('JDB');
  }

  /**
   * 解析 JDB 匯率數據
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // 等待頁面完全加載
    this.logger.info('等待頁面加載...');
    await this.page.waitForTimeout(5000);

    // 查找所有表格
    const tables = await this.page.$$('table');
    this.logger.info(`找到 ${tables.length} 個表格`);

    if (tables.length === 0) {
      throw new Error('無法找到匯率表格');
    }

    // 用於追蹤已添加的幣種（避免重複）
    const addedCurrencies = new Set<string>();

    // 只使用第一個表格（主表格）
    if (tables.length === 0) {
      throw new Error('無法找到匯率表格');
    }

    const mainTable = tables[0];
    const rows = await mainTable.$$('tr');
    this.logger.info(`主表格有 ${rows.length} 行`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // JDB 表格結構：
      // 數據行格式：<th>幣種</th> <td>買入1</td> <td>買入2</td> <td>賣出1</td> <td>賣出2</td>
      // 所以需要同時檢查 th 和 td
      const ths = await row.$$('th');
      const tds = await row.$$('td');
      
      // 如果有多個 th，可能是標題行
      if (ths.length > 1) {
        continue; // 跳過標題行
      }
      
      // 數據行應該有 1 個 th 和 4 個 td
      if (ths.length !== 1 || tds.length !== 4) {
        continue;
      }

      // 獲取幣種（在 th 中）
      const thText = await ths[0].textContent();
      const currencyText = thText?.trim() || '';
      const currency = this.parseCurrency(currencyText);

      if (!currency || !TARGET_CURRENCIES.includes(currency)) {
        continue;
      }

      // 已經添加過此幣種，跳過
      if (addedCurrencies.has(currency)) {
        continue;
      }

      // 獲取價格（在 td 中）
      const tdTexts = await Promise.all(tds.map(td => td.textContent()));
      const cleanedTdTexts = tdTexts.map(t => t?.trim().replace(/\s+/g, ' ') || '');

      // JDB 表格：<td>Bank Note買入</td> <td>T/T買入</td> <td>T/T賣出</td> <td>Bank Note賣出</td>
      // 我們使用 T/T 價格（更通用）
      // 買入: td[1] (T/T買入)
      // 賣出: td[2] (T/T賣出)
      const buyPriceText = cleanedTdTexts[1];
      const sellPriceText = cleanedTdTexts[2];

      const buyPrice = this.parseNumber(buyPriceText);
      const sellPrice = this.parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        this.logger.warning(`無法解析價格: ${currency} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
      rates.push(rate);
      addedCurrencies.add(currency);
      this.logger.success(`解析成功: ${rate.currencyPair} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
    }

    return rates;
  }
}

// 導出爬取函數
export async function scrapeJDB() {
  const scraper = new JDBScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeJDB()
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
