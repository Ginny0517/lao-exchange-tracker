/**
 * 檢查 InstantDB 中的當前匯率數據
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { init } from '@instantdb/admin';

async function checkDatabase() {
  const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  const INSTANT_ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

  if (!INSTANT_APP_ID || !INSTANT_ADMIN_TOKEN) {
    console.error('❌ 環境變數未設置');
    process.exit(1);
  }

  const db = init({
    appId: INSTANT_APP_ID,
    adminToken: INSTANT_ADMIN_TOKEN,
  });

  console.log('🔍 查詢 InstantDB 當前匯率數據...\n');

  try {
    const { currentRates } = await db.query({
      currentRates: {},
    });

    console.log(`📊 總計: ${currentRates.length} 筆數據\n`);

    // 按銀行分組
    const bankGroups: Record<string, any[]> = {};
    currentRates.forEach((rate: any) => {
      if (!bankGroups[rate.bankId]) {
        bankGroups[rate.bankId] = [];
      }
      bankGroups[rate.bankId].push(rate);
    });

    // 顯示每個銀行的數據
    Object.keys(bankGroups).sort().forEach(bankId => {
      const rates = bankGroups[bankId];
      console.log(`\n🏦 ${bankId} (${rates[0].bankName})`);
      console.log(`   數量: ${rates.length} 筆`);
      rates.forEach((rate: any) => {
        const timestamp = new Date(rate.timestamp).toLocaleString('zh-TW');
        console.log(`   - ${rate.currencyPair}: ${rate.buyPrice} → ${rate.sellPrice} (${timestamp})`);
      });
    });

    // 檢查是否有 LDB
    if (bankGroups['LDB']) {
      console.log('\n✅ LDB 數據存在！');
    } else {
      console.log('\n❌ LDB 數據不存在（已被之前的錯誤邏輯刪除）');
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
    process.exit(1);
  }
}

checkDatabase();
