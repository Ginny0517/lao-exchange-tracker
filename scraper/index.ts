/**
 * 爬蟲主入口
 * 用於爬取所有銀行的匯率數據並寫入 InstantDB
 */

// 加載環境變數
import { config } from 'dotenv';
import { resolve } from 'path';

// 加載 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { scrapeBOL } from './scrapers/bol-v2';
import { scrapeBCEL } from './scrapers/bcel';
import { scrapeLDB } from './scrapers/ldb';
import { scrapeAPB } from './scrapers/apb';
import { scrapeJDB } from './scrapers/jdb';
import { ScraperResult, ScrapedRate } from './lib/types';
import { writeCurrentRates, writeHistoricalRates } from './lib/instantdb';

// 所有爬蟲列表
const scrapers = [
  { name: 'BOL', fn: scrapeBOL },
  { name: 'BCEL', fn: scrapeBCEL },
  { name: 'LDB', fn: scrapeLDB },
  { name: 'APB', fn: scrapeAPB },
  { name: 'JDB', fn: scrapeJDB },
];

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 老撾銀行匯率爬蟲系統');
  console.log('='.repeat(60));

  const allRates: ScrapedRate[] = [];
  const results: ScraperResult[] = [];

  // 依次執行每個爬蟲
  for (const scraper of scrapers) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🏦 開始爬取: ${scraper.name}`);
    console.log(`${'─'.repeat(60)}`);

    try {
      const result = await scraper.fn();
      results.push(result);

      if (result.success) {
        console.log(`✅ ${scraper.name} 爬取成功: ${result.rates.length} 筆數據`);
        allRates.push(...result.rates);
      } else {
        console.error(`❌ ${scraper.name} 爬取失敗: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ ${scraper.name} 執行錯誤:`, error);
      results.push({
        success: false,
        bankId: scraper.name,
        rates: [],
        error: error instanceof Error ? error.message : String(error),
        scrapedAt: Date.now(),
      });
    }

    // 每個爬蟲之間暫停 2 秒，避免請求過快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 顯示總結
  console.log('\n' + '='.repeat(60));
  console.log('📊 爬取總結');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n總銀行數: ${results.length}`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失敗: ${failCount}`);
  console.log(`📈 總匯率數: ${allRates.length}`);

  if (allRates.length > 0) {
    console.log('\n💾 寫入數據到 InstantDB...');
    
    try {
      await writeCurrentRates(allRates);
      await writeHistoricalRates(allRates);
      console.log('✅ 數據寫入完成');
    } catch (error) {
      console.error('❌ 數據寫入失敗:', error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ 爬取任務完成');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
