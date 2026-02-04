/**
 * 測試所有銀行爬蟲
 */

// 加載環境變數
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { scrapeBOL } from './scrapers/bol-v2';
import { scrapeBCEL } from './scrapers/bcel';
import { scrapeLDB } from './scrapers/ldb';
import { scrapeAPB } from './scrapers/apb';
import { scrapeJDB } from './scrapers/jdb';
import { saveToJsonFile } from './lib/instantdb';
import { ScraperResult } from './lib/types';

interface TestResult {
  bank: string;
  success: boolean;
  ratesCount: number;
  error?: string;
  duration: number;
}

async function testScraper(
  name: string,
  scraperFn: () => Promise<ScraperResult>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await scraperFn();
    const duration = Date.now() - startTime;

    return {
      bank: name,
      success: result.success,
      ratesCount: result.rates.length,
      error: result.error,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      bank: name,
      success: false,
      ratesCount: 0,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 測試所有銀行爬蟲');
  console.log('='.repeat(70));

  const scrapers = [
    { name: 'BOL', fn: scrapeBOL },
    { name: 'BCEL', fn: scrapeBCEL },
    { name: 'LDB', fn: scrapeLDB },
    { name: 'APB', fn: scrapeAPB },
    { name: 'JDB', fn: scrapeJDB },
  ];

  const results: TestResult[] = [];

  // 依次測試每個爬蟲
  for (const scraper of scrapers) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🏦 測試: ${scraper.name}`);
    console.log(`${'─'.repeat(70)}\n`);

    const result = await testScraper(scraper.name, scraper.fn);
    results.push(result);

    // 每個爬蟲之間暫停 3 秒，避免請求過快
    if (scraper !== scrapers[scrapers.length - 1]) {
      console.log('\n⏳ 等待 3 秒後繼續下一個銀行...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 顯示測試總結
  console.log('\n' + '='.repeat(70));
  console.log('📊 測試總結');
  console.log('='.repeat(70));

  console.log('\n| 銀行 | 狀態 | 數據量 | 耗時 | 錯誤 |');
  console.log('|------|------|--------|------|------|');

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const duration = `${(result.duration / 1000).toFixed(1)}s`;
    const error = result.error ? result.error.substring(0, 30) : '-';
    console.log(
      `| ${result.bank.padEnd(4)} | ${status} | ${result.ratesCount.toString().padEnd(6)} | ${duration.padEnd(4)} | ${error} |`
    );
  }

  // 統計
  const successCount = results.filter(r => r.success).length;
  const totalRates = results.reduce((sum, r) => sum + r.ratesCount, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log('\n' + '─'.repeat(70));
  console.log(`總銀行數: ${results.length}`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失敗: ${results.length - successCount}`);
  console.log(`📈 總數據量: ${totalRates} 筆`);
  console.log(`⏱️  總耗時: ${(totalDuration / 1000).toFixed(1)}s`);

  // 保存測試結果到 JSON
  const testSummary = {
    testTime: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      totalRates,
      totalDuration,
    },
  };

  await saveToJsonFile(
    results.flatMap(r => []),
    `test_all_scrapers_${Date.now()}.json`
  ).catch(() => {}); // 忽略保存錯誤

  // 將詳細結果寫入文件
  const fs = await import('fs/promises');
  const path = await import('path');
  const outputDir = path.join(process.cwd(), 'scraper', 'test-output');
  await fs.writeFile(
    path.join(outputDir, `test_summary_${Date.now()}.json`),
    JSON.stringify(testSummary, null, 2),
    'utf-8'
  );

  console.log('\n' + '='.repeat(70));
  console.log('✨ 測試完成');
  console.log('='.repeat(70));

  // 如果有失敗，返回非零退出碼
  process.exit(successCount === results.length ? 0 : 1);
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
