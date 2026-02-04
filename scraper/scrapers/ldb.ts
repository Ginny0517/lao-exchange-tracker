/**
 * LDB (Lao Development Bank) 爬蟲
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class LDBScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'LDB',
      bankName: 'Lao Development Bank',
      url: 'https://www.ldblao.la/interest?tab=3',
    });
    
    this.logger = new Logger('LDB');
  }

  /**
   * 判斷是否為優先面額
   * USD: 優先選擇 "1-100" 或 "T/T"
   * THB: 優先選擇 "CASH" 或 "T/T"
   * 其他: 優先選擇第一個遇到的
   */
  private isPreferredDenomination(currencyCode: string, denominationInfo: string): boolean {
    const upper = denominationInfo.toUpperCase();
    
    if (currencyCode === 'USD') {
      // 優先 T/T，其次 1-100
      if (upper.includes('T/T')) return true;
      if (upper.includes('1-100')) return true;
      return false;
    }
    
    if (currencyCode === 'THB') {
      // 優先 T/T，其次 CASH
      if (upper.includes('T/T')) return true;
      if (upper.includes('CASH')) return true;
      return false;
    }
    
    // CNY, EUR 等：優先 T/T 或 CASH
    if (upper.includes('T/T')) return true;
    if (upper.includes('CASH')) return true;
    
    return false;
  }

  /**
   * 解析 LDB 匯率數據
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // 等待頁面加載（增加等待時間因為是動態內容）
    this.logger.info('等待頁面加載...');
    await this.page.waitForTimeout(5000);
    
    // 等待表格加載
    try {
      await this.page.waitForSelector('table.ex-table', { timeout: 10000 });
      this.logger.info('表格已加載');
    } catch (error) {
      this.logger.warning('未找到 table.ex-table，嘗試查找其他表格');
    }

    // 查找表格（優先使用 .ex-table）
    const tables = await this.page.$$('table.ex-table, table');
    this.logger.info(`找到 ${tables.length} 個表格`);

    if (tables.length === 0) {
      throw new Error('無法找到匯率表格');
    }

    // 使用第一個表格
    const table = tables[0];
    const rows = await table.$$('tr');
    this.logger.info(`找到 ${rows.length} 行數據`);

    // 用於追蹤已添加的幣種（避免重複）
    const addedCurrencies = new Map<string, ScrapedRate>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td');
      
      // 跳過標題行（沒有 td 只有 th）
      if (cells.length < 3) continue;

      const cellTexts = await Promise.all(
        cells.map(cell => cell.textContent())
      );

      // 清理文本
      const cleanedTexts = cellTexts.map(t => t?.trim().replace(/\s+/g, ' ') || '');

      // LDB 表格結構：[圖片] | [幣種描述] | [買入價] | [賣出價]
      // 例如：[img] | "USD CASH 1-20" | "21,283" | "21,612"
      if (cleanedTexts.length < 4) continue;

      const denominationInfo = cleanedTexts[1]; // 第二列是幣種描述
      const buyPriceText = cleanedTexts[2];     // 第三列是買入價
      const sellPriceText = cleanedTexts[3];    // 第四列是賣出價

      // 提取幣種代碼
      const currency = this.parseCurrency(denominationInfo);
      if (!currency || !TARGET_CURRENCIES.includes(currency)) {
        continue;
      }

      // 解析價格
      const buyPrice = this.parseNumber(buyPriceText);
      const sellPrice = this.parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        this.logger.warning(`無法解析價格: ${denominationInfo} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      // 檢查是否已有此幣種
      const existingRate = addedCurrencies.get(currency);
      
      if (existingRate) {
        // 如果當前面額更優，則替換
        if (this.isPreferredDenomination(currency, denominationInfo)) {
          this.logger.info(`替換為優先面額: ${currency} - ${denominationInfo}`);
          const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
          addedCurrencies.set(currency, rate);
          this.logger.success(`解析成功: ${rate.currencyPair} - ${denominationInfo} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
        } else {
          this.logger.info(`跳過非優先面額: ${denominationInfo}`);
        }
      } else {
        // 第一次遇到此幣種，直接添加
        const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
        addedCurrencies.set(currency, rate);
        this.logger.success(`解析成功: ${rate.currencyPair} - ${denominationInfo} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
      }
    }

    // 轉換為數組
    return Array.from(addedCurrencies.values());
  }
}

// 導出爬取函數
export async function scrapeLDB() {
  const scraper = new LDBScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeLDB()
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
