/**
 * 爬蟲測試腳本
 * 用於測試單個爬蟲並將結果保存到本地 JSON 文件
 */

import { scrapeBOL } from './scrapers/bol';
import { saveToJsonFile } from './lib/instantdb';

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 爬蟲測試模式');
  console.log('='.repeat(60));

  // 測試 BOL 爬蟲
  console.log('\n📋 測試銀行: Bank of Laos (BOL)');
  
  const result = await scrapeBOL();

  if (result.success) {
    console.log('\n✅ 爬取成功！');
    console.log(`📊 獲取到 ${result.rates.length} 筆匯率數據`);

    // 顯示數據摘要
    console.log('\n📈 數據摘要:');
    result.rates.forEach(rate => {
      console.log(`  - ${rate.currencyPair}: 買入 ${rate.buyPrice} / 賣出 ${rate.sellPrice} (價差: ${rate.spread})`);
    });

    // 保存到 JSON 文件
    await saveToJsonFile(result.rates, `bol_${Date.now()}.json`);

  } else {
    console.error('\n❌ 爬取失敗:', result.error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ 測試完成');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
