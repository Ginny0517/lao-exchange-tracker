/**
 * InstantDB 寫入測試腳本
 * 測試爬蟲數據寫入到 InstantDB
 */

// 加載環境變數
import { config } from 'dotenv';
import { resolve } from 'path';

// 加載 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { scrapeBOL } from './scrapers/bol';
import { writeCurrentRates, writeHistoricalRates, saveToJsonFile } from './lib/instantdb';

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 InstantDB 寫入測試');
  console.log('='.repeat(60));

  // 調試：顯示環境變數狀態
  console.log('\n🔍 環境變數檢查:');
  console.log('工作目錄:', process.cwd());
  console.log('NEXT_PUBLIC_INSTANT_APP_ID:', process.env.NEXT_PUBLIC_INSTANT_APP_ID ? '✅ 已設置' : '❌ 未設置');
  console.log('INSTANT_ADMIN_TOKEN:', process.env.INSTANT_ADMIN_TOKEN ? '✅ 已設置' : '❌ 未設置');
  
  if (!process.env.NEXT_PUBLIC_INSTANT_APP_ID || !process.env.INSTANT_ADMIN_TOKEN) {
    console.error('\n❌ 環境變數未正確加載！');
    console.error('請確認 .env.local 文件存在於項目根目錄');
    process.exit(1);
  }

  // 步驟 1: 爬取數據
  console.log('\n📋 步驟 1: 爬取 BOL 匯率數據');
  const result = await scrapeBOL();

  if (!result.success) {
    console.error('\n❌ 爬取失敗:', result.error);
    process.exit(1);
  }

  console.log(`✅ 成功爬取 ${result.rates.length} 筆數據`);
  
  // 顯示數據摘要
  console.log('\n📈 數據摘要:');
  result.rates.forEach(rate => {
    console.log(`  - ${rate.currencyPair}: 買入 ${rate.buyPrice} / 賣出 ${rate.sellPrice}`);
  });

  // 步驟 2: 保存到本地 JSON（備份）
  console.log('\n📋 步驟 2: 保存到本地 JSON 備份');
  await saveToJsonFile(result.rates, `bol_instantdb_test_${Date.now()}.json`);

  // 步驟 3: 寫入 InstantDB
  console.log('\n📋 步驟 3: 寫入到 InstantDB');
  
  try {
    // 寫入當前匯率
    console.log('\n➡️  寫入當前匯率...');
    await writeCurrentRates(result.rates);
    
    // 寫入歷史匯率
    console.log('\n➡️  寫入歷史匯率...');
    await writeHistoricalRates(result.rates);
    
    console.log('\n🎉 所有數據成功寫入 InstantDB！');
    
  } catch (error) {
    console.error('\n❌ InstantDB 寫入失敗:', error);
    if (error instanceof Error) {
      console.error('錯誤詳情:', error.message);
      console.error('錯誤堆疊:', error.stack);
    }
    process.exit(1);
  }

  // 步驟 4: 驗證提示
  console.log('\n' + '='.repeat(60));
  console.log('📋 驗證步驟');
  console.log('='.repeat(60));
  console.log('\n請執行以下步驟驗證數據：');
  console.log('1. 前往 https://instantdb.com/dash');
  console.log('2. 選擇您的應用');
  console.log('3. 查看 currentRates 和 historicalRates 表');
  console.log('4. 確認數據已成功寫入');
  console.log('\n或者：');
  console.log('1. 運行前端：npm run dev');
  console.log('2. 訪問 http://localhost:3000');
  console.log('3. 檢查是否顯示實時數據');

  console.log('\n' + '='.repeat(60));
  console.log('✨ 測試完成');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
