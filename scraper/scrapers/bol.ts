/**
 * Bank of Laos (BOL) 爬蟲
 * 網址: https://bol.gov.la/ExchangRate.php
 */

import { chromium } from 'playwright';
import { ScrapedRate, ScraperResult } from '../lib/types';
import { validateRates, formatValidationReport } from '../lib/validator';

const BANK_ID = 'BOL';
const BANK_NAME = 'Bank of Laos';
const URL = 'https://bol.gov.la/ExchangRate.php';

// 支援的幣種映射
const CURRENCY_MAP: Record<string, string> = {
  'USD': 'USD',
  'US': 'USD',
  'DOLLAR': 'USD',
  'THB': 'THB',
  'BAHT': 'THB',
  'CNY': 'CNY',
  'YUAN': 'CNY',
  'RMB': 'CNY',
  'EUR': 'EUR',
  'EURO': 'EUR',
};

/**
 * 解析幣種代碼
 */
function parseCurrency(text: string): string | null {
  const normalized = text.toUpperCase().trim();
  
  for (const [key, value] of Object.entries(CURRENCY_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * 解析數字（處理 BOL 網站的歐洲格式）
 * BOL 使用歐洲數字格式：
 * - 句點 (.) 作為千分位分隔符：21.409 = 21409
 * - 逗號 (,) 作為小數點：675,85 = 675.85
 */
function parseNumber(text: string): number | null {
  // 移除空格
  let cleaned = text.trim().replace(/\s/g, '');
  
  if (!cleaned) return null;
  
  // BOL 特定格式處理：
  // 如果有句點和逗號，句點是千分位，逗號是小數點（如 "1.234,56"）
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // 移除所有句點（千分位），將逗號替換為句點（小數點）
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } 
  // 如果只有句點
  else if (cleaned.includes('.')) {
    // 判斷是千分位還是小數點
    const dotIndex = cleaned.lastIndexOf('.');
    const afterDot = cleaned.substring(dotIndex + 1);
    
    // 如果句點後面只有 1-2 位數字，可能是小數點
    // 但對於 BOL，如果數字 >= 1000，句點是千分位
    if (afterDot.length === 3) {
      // 千分位（如 "21.409" = 21409）
      cleaned = cleaned.replace(/\./g, '');
    }
    // 否則保留作為小數點
  }
  // 如果只有逗號，則是小數點
  else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * 爬取 BOL 匯率數據
 */
export async function scrapeBOL(): Promise<ScraperResult> {
  console.log(`\n🚀 開始爬取 ${BANK_NAME}...`);
  console.log(`📍 URL: ${URL}`);

  let browser;
  const rates: ScrapedRate[] = [];

  try {
    // 啟動瀏覽器
    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'en-US',
    });

    const page = await context.newPage();

    // 設置超時時間
    page.setDefaultTimeout(30000);

    console.log('📡 正在訪問網站...');
    await page.goto(URL, { waitUntil: 'networkidle' });

    console.log('⏳ 等待頁面加載完成...');
    await page.waitForTimeout(2000);

    // 獲取頁面 HTML
    const html = await page.content();
    console.log(`📄 頁面 HTML 長度: ${html.length} 字符`);

    // 嘗試多種選擇器來尋找表格
    const possibleSelectors = [
      'table',
      '.exchange-rate-table',
      '#exchange-rate',
      '[class*="rate"]',
      '[id*="rate"]',
    ];

    let tableFound = false;
    let tableHtml = '';

    for (const selector of possibleSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ 找到 ${elements.length} 個 ${selector} 元素`);
        tableFound = true;
        
        // 獲取第一個表格的 HTML（通常匯率表格是第一個）
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          const innerHtml = await elements[i].innerHTML();
          console.log(`\n表格 ${i + 1} 文本內容 (前 200 字符):`);
          console.log(text?.substring(0, 200));
          
          if (i === 0) {
            tableHtml = innerHtml || '';
          }
        }
        break;
      }
    }

    if (!tableFound) {
      throw new Error('無法在頁面中找到匯率表格');
    }

    // 嘗試解析表格行
    const rows = await page.$$('table tr, table tbody tr');
    console.log(`\n📊 找到 ${rows.length} 行數據`);

    const timestamp = Date.now();

    // 需要爬取的幣種（根據前端支持）
    const targetCurrencies = ['USD', 'THB', 'CNY', 'EUR'];

    // 解析每一行
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td, th');
      
      if (cells.length < 6) continue; // BOL 表格有 6 列

      const cellTexts = await Promise.all(
        cells.map(cell => cell.textContent())
      );

      console.log(`\n行 ${i + 1}:`, cellTexts.map(t => t?.trim()));

      // BOL 表格結構：
      // 0: 序號, 1: 國家, 2: 幣種名稱, 3: 幣種代碼, 4: 買入價, 5: 賣出價
      const currencyCode = cellTexts[3]?.trim() || '';
      const currency = parseCurrency(currencyCode);

      // 只處理目標幣種
      if (!currency || !targetCurrencies.includes(currency)) {
        console.log(`  ⏭️  跳過非目標幣種: ${currencyCode}`);
        continue;
      }

      // 提取買入價和賣出價（第 5、6 列）
      const buyPriceText = cellTexts[4]?.trim() || '';
      const sellPriceText = cellTexts[5]?.trim() || '';

      const buyPrice = parseNumber(buyPriceText);
      const sellPrice = parseNumber(sellPriceText);

      if (!buyPrice || !sellPrice) {
        console.log(`  ⚠️  無法解析價格: 買入=${buyPriceText}, 賣出=${sellPriceText}`);
        continue;
      }

      const spread = sellPrice - buyPrice;

      const rate: ScrapedRate = {
        bankId: BANK_ID,
        bankName: BANK_NAME,
        currencyPair: `${currency}/LAK`,
        fromCurrency: currency,
        toCurrency: 'LAK',
        buyPrice,
        sellPrice,
        spread,
        timestamp,
        source: URL,
      };

      rates.push(rate);
      console.log(`  ✅ 成功解析: ${rate.currencyPair} - 買入: ${buyPrice}, 賣出: ${sellPrice}`);
    }

    await browser.close();

    // 驗證數據
    const { valid, invalid } = validateRates(rates);
    console.log(formatValidationReport(valid, invalid));

    if (valid.length === 0) {
      throw new Error('沒有有效的匯率數據');
    }

    return {
      success: true,
      bankId: BANK_ID,
      rates: valid,
      scrapedAt: timestamp,
    };

  } catch (error) {
    console.error(`\n❌ 爬取失敗:`, error);
    
    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      bankId: BANK_ID,
      rates: [],
      error: error instanceof Error ? error.message : String(error),
      scrapedAt: Date.now(),
    };
  }
}

// 直接運行此文件時執行爬取
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
