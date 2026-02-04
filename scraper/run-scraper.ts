/**
 * 運行所有爬蟲並寫入 InstantDB
 * 這是主要的生產環境執行腳本
 */

// 加載環境變數
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { scrapeBCEL } from './scrapers/bcel';
import { scrapeLDB } from './scrapers/ldb';
import { scrapeAPB } from './scrapers/apb';
import { scrapeJDB } from './scrapers/jdb';
import { scrapeSTB } from './scrapers/stb';
import { writeCurrentRates, writeHistoricalRates, saveToJsonFile } from './lib/instantdb';
import { ScraperResult, ScrapedRate } from './lib/types';

// 所有爬蟲列表（移除 BOL - 當地無法換匯）
const scrapers = [
  { name: 'BCEL', fn: scrapeBCEL },
  { name: 'LDB', fn: scrapeLDB },
  { name: 'APB', fn: scrapeAPB },
  { name: 'JDB', fn: scrapeJDB },
  { name: 'STB', fn: scrapeSTB }, // ✅ 已啟用 - 需要寮國 VPN
];

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 老撾銀行匯率爬蟲系統 - 生產模式');
  console.log('='.repeat(70));

  const allRates: ScrapedRate[] = [];
  const results: ScraperResult[] = [];
  const startTime = Date.now();

  // 依次執行每個爬蟲
  for (const scraper of scrapers) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🏦 爬取: ${scraper.name}`);
    console.log(`${'─'.repeat(70)}`);

    try {
      const result = await scraper.fn();
      results.push(result);

      if (result.success) {
        console.log(`✅ ${scraper.name} 成功: ${result.rates.length} 筆數據`);
        allRates.push(...result.rates);
      } else {
        console.error(`❌ ${scraper.name} 失敗: ${result.error}`);
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

    // 每個爬蟲之間暫停 2 秒
    if (scraper !== scrapers[scrapers.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 顯示總結
  console.log('\n' + '='.repeat(70));
  console.log('📊 爬取總結');
  console.log('='.repeat(70));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalDuration = Date.now() - startTime;

  console.log(`\n總銀行數: ${results.length}`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失敗: ${failCount}`);
  console.log(`📈 總匯率數: ${allRates.length} 筆`);
  console.log(`⏱️  總耗時: ${(totalDuration / 1000).toFixed(1)}s`);

  if (allRates.length > 0) {
    console.log('\n' + '─'.repeat(70));
    console.log('💾 寫入數據到 InstantDB');
    console.log('─'.repeat(70));
    
    try {
      // 寫入當前匯率
      await writeCurrentRates(allRates);
      
      // 寫入歷史匯率
      await writeHistoricalRates(allRates);
      
      // 同時保存到本地 JSON 備份
      await saveToJsonFile(allRates, `production_${Date.now()}.json`);
      
      console.log('\n✅ 所有數據已成功寫入 InstantDB 和本地備份');
    } catch (error) {
      console.error('\n❌ 數據寫入失敗:', error);
      process.exit(1);
    }
  } else {
    console.warn('\n⚠️  沒有數據可寫入');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✨ 爬取任務完成');
  console.log(`📅 完成時間: ${new Date().toLocaleString('zh-TW')}`);
  console.log('='.repeat(70));

  // 如果有失敗，返回非零退出碼
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
