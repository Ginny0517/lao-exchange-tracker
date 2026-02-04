/**
 * BCEL (Banque Pour Le Commerce Exterieur Lao) 爬蟲
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class BCELScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'BCEL',
      bankName: 'BCEL',
      url: 'https://www.bcel.com.la/bcel/exchange-rate.html',
    });
    
    this.logger = new Logger('BCEL');
  }

  /**
   * 檢查是否為期望的面額
   * USD: 優先選擇 50-100
   * EUR: 優先選擇 50-500
   */
  private isPreferredDenomination(rowText: string, currency: string): boolean {
    const text = rowText.toLowerCase();
    
    if (currency === 'USD') {
      // 檢查是否包含 "50-100" 或 "50" 或 "100"
      return text.includes('50-100') || text.includes('50') || text.includes('100');
    } else if (currency === 'EUR') {
      // 檢查是否包含 "50-500" 或 "50" 或 "500"
      return text.includes('50-500') || text.includes('500');
    }
    
    return true; // THB 和 CNY 沒有面額區分
  }

  /**
   * 解析 BCEL 匯率數據
   * BCEL 表格有多列：NOTE, BILL, EFT
   * 我們取 BILL 列作為買入價，EFT 列作為賣出價
   * 
   * 特殊處理：
   * - USD: 選擇 50-100 面額
   * - EUR: 選擇 50-500 面額
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // 等待表格加載
    await this.page.waitForSelector('table', { timeout: 10000 });
    this.logger.info('表格已加載');

    // 查找所有表格行
    const rows = await this.page.$$('table tbody tr, table tr');
    this.logger.info(`找到 ${rows.length} 行數據`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td');
      
      if (cells.length < 3) continue;

      const cellTexts = await Promise.all(
        cells.map(cell => cell.textContent())
      );

      // 清理文本
      const cleanedTexts = cellTexts.map(t => t?.trim() || '');
      
      // 獲取整行文本用於面額判斷
      const rowText = cleanedTexts.join(' ');
      
      // 嘗試提取幣種代碼
      let currencyCode = '';
      let currencyName = '';
      let buyPriceText = '';
      let sellPriceText = '';

      // BCEL 實際表格結構：[幣種名稱, 空列, 面額代碼, NOTE, BILL, EFT, 賣出]
      // 示例：["US Dollar", "", "USD 50-100", "21,182", "21,182", "21,184", "21,506"]
      // 索引：    0          1      2           3         4         5        6
      
      if (cleanedTexts.length < 7) {
        continue; // 必須有 7 列
      }
      
      currencyName = cleanedTexts[0] || '';
      const denominationInfo = cleanedTexts[2] || ''; // 面額代碼在第3列（索引2）
      
      // 從面額信息中提取幣種代碼（如 "USD 50-100" -> "USD"）
      const codeMatch = denominationInfo.match(/^([A-Z]{3})/);
      if (codeMatch) {
        currencyCode = codeMatch[1];
      }

      if (!currencyCode) {
        continue;
      }

      const currency = this.parseCurrency(currencyCode);

      // 只處理目標幣種
      if (!currency || !TARGET_CURRENCIES.includes(currency)) {
        continue;
      }

      // 檢查是否為期望的面額
      if (!this.isPreferredDenomination(denominationInfo, currency)) {
        this.logger.info(`跳過非期望面額: ${denominationInfo}`);
        continue;
      }

      // 提取價格（BILL 和 賣出 列）
      // 索引：    0          1      2           3         4         5        6
      // 內容：  幣種名     空     面額代碼     NOTE      BILL      EFT      賣出
      buyPriceText = cleanedTexts[4]; // BILL 列（索引 4）
      sellPriceText = cleanedTexts[6]; // 賣出列（索引 6）

      const buyPrice = this.parseNumber(buyPriceText);
      const sellPrice = this.parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        this.logger.warning(`無法解析價格: ${currencyCode} ${denominationInfo} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      // 檢查是否已有此幣種的匯率
      const existingRate = rates.find(r => r.currencyPair === `${currency}/LAK`);
      if (existingRate) {
        // 如果新的買入價更優（更高），則替換
        if (buyPrice > existingRate.buyPrice) {
          const index = rates.indexOf(existingRate);
          rates[index] = this.createRate(currency, buyPrice, sellPrice, timestamp);
          this.logger.info(`更新匯率: ${currency} - ${denominationInfo} (更優價格)`);
        } else {
          this.logger.info(`保留現有匯率: ${currency} (已有更優價格)`);
        }
        continue;
      }

      const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
      rates.push(rate);
      this.logger.success(`解析成功: ${rate.currencyPair} - ${denominationInfo} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
    }

    return rates;
  }
}

// 導出爬取函數
export async function scrapeBCEL() {
  const scraper = new BCELScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeBCEL()
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
