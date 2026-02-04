/**
 * STB (Siam Commercial Bank Laos) 爬蟲
 */

import { BaseScraper } from '../lib/base-scraper';
import { ScrapedRate } from '../lib/types';
import { Logger } from '../lib/utils';

const TARGET_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR'];

export class STBScraper extends BaseScraper {
  private logger: Logger;

  constructor() {
    super({
      bankId: 'STB',
      bankName: 'Siam Commercial Bank Laos',
      url: 'https://www.stbanklaos.la/',
    });
    
    this.logger = new Logger('STB');
  }

  /**
   * 解析 STB 匯率數據
   */
  protected async parseRates(): Promise<ScrapedRate[]> {
    if (!this.page) {
      throw new Error('頁面未初始化');
    }

    const rates: ScrapedRate[] = [];
    const timestamp = Date.now();

    // 等待頁面加載
    this.logger.info('等待頁面加載...');
    await this.page.waitForTimeout(5000);

    // STB 使用卡片式佈局，每個幣種一個卡片
    const currencyCards = await this.page.$$('.single-money-exchange-value');
    this.logger.info(`找到 ${currencyCards.length} 個幣種卡片`);

    for (const card of currencyCards) {
      try {
        // 獲取幣種代碼（在 h3 標籤中）
        const h3 = await card.$('h3');
        if (!h3) continue;

        const currencyText = await h3.textContent();
        const currency = this.parseCurrency(currencyText || '');

        if (!currency || !TARGET_CURRENCIES.includes(currency)) {
          continue;
        }

        // 獲取所有 li 元素
        const listItems = await card.$$('li');
        
        if (listItems.length < 2) {
          this.logger.warning(`${currency}: 數據不完整`);
          continue;
        }

        // 第一個 li 是買入價（ອັດຕາຊື້）
        // 第二個 li 是賣出價（ອັດຕາຂາຍ）
        const buyPriceElement = await listItems[0].$('.right p');
        const sellPriceElement = await listItems[1].$('.right p');

        if (!buyPriceElement || !sellPriceElement) {
          this.logger.warning(`${currency}: 無法找到價格元素`);
          continue;
        }

        const buyPriceText = (await buyPriceElement.textContent())?.trim() || '';
        const sellPriceText = (await sellPriceElement.textContent())?.trim() || '';

        const buyPrice = this.parseNumber(buyPriceText);
        const sellPrice = this.parseNumber(sellPriceText);

        if (!buyPrice || !sellPrice) {
          this.logger.warning(`無法解析價格: ${currency} - 買入=${buyPriceText}, 賣出=${sellPriceText}`);
          continue;
        }

        const rate = this.createRate(currency, buyPrice, sellPrice, timestamp);
        rates.push(rate);
        this.logger.success(`解析成功: ${rate.currencyPair} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);

      } catch (error) {
        this.logger.warning(`解析卡片時出錯: ${error}`);
        continue;
      }
    }

    return rates;
  }
}

// 導出爬取函數
export async function scrapeSTB() {
  const scraper = new STBScraper();
  return await scraper.scrape();
}

// 直接運行
if (require.main === module) {
  scrapeSTB()
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
