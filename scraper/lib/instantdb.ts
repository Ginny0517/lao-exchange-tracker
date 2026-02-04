/**
 * InstantDB 寫入模組
 */

import { init, id } from '@instantdb/admin';
import { ScrapedRate, CurrentRateDB, HistoricalRateDB } from './types';

// 初始化 InstantDB Admin SDK
let db: ReturnType<typeof init> | null = null;

function getDB() {
  if (!db) {
    // 在函數內部讀取環境變數，而不是模組加載時
    const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const INSTANT_ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;
    
    if (!INSTANT_APP_ID || !INSTANT_ADMIN_TOKEN) {
      console.error('環境變數狀態:');
      console.error('  NEXT_PUBLIC_INSTANT_APP_ID:', INSTANT_APP_ID || '(未設置)');
      console.error('  INSTANT_ADMIN_TOKEN:', INSTANT_ADMIN_TOKEN ? '(已設置)' : '(未設置)');
      throw new Error('InstantDB 配置不完整，請檢查環境變數 NEXT_PUBLIC_INSTANT_APP_ID 和 INSTANT_ADMIN_TOKEN');
    }
    
    db = init({
      appId: INSTANT_APP_ID,
      adminToken: INSTANT_ADMIN_TOKEN,
    });
  }
  return db;
}

/**
 * 將爬取的數據轉換為 InstantDB 格式
 */
export function convertToCurrentRate(rate: ScrapedRate): Omit<CurrentRateDB, 'id'> {
  return {
    bankId: rate.bankId,
    bankName: rate.bankName,
    currencyPair: rate.currencyPair,
    buyPrice: rate.buyPrice,
    sellPrice: rate.sellPrice,
    spread: rate.spread,
    percentChange24h: 0, // 需要從歷史數據計算
    timestamp: rate.timestamp,
  };
}

/**
 * 將爬取的數據轉換為歷史記錄格式
 */
export function convertToHistoricalRate(rate: ScrapedRate): HistoricalRateDB {
  const date = new Date(rate.timestamp);
  return {
    id: `hist_${rate.bankId}_${rate.currencyPair}_${rate.timestamp}`,
    bankId: rate.bankId,
    currencyPair: rate.currencyPair,
    buyPrice: rate.buyPrice,
    sellPrice: rate.sellPrice,
    date: date.toISOString().split('T')[0],
    hour: date.getHours(),
    timestamp: rate.timestamp,
  };
}

/**
 * 寫入當前匯率到 InstantDB
 * 策略：只更新本次成功爬取的銀行數據，保留其他銀行的舊數據
 */
export async function writeCurrentRates(rates: ScrapedRate[]): Promise<void> {
  const database = getDB();
  const currentRates = rates.map(convertToCurrentRate);

  console.log(`\n📝 準備寫入 ${currentRates.length} 筆當前匯率到 InstantDB...`);

  try {
    // 獲取本次爬取的銀行 ID 列表
    const scrapedBankIds = [...new Set(rates.map(r => r.bankId))];
    console.log(`🏦 本次爬取的銀行: ${scrapedBankIds.join(', ')}`);

    // 第一步：查詢現有的當前匯率
    console.log('🗑️  清理本次爬取銀行的舊數據...');
    const { currentRates: existingRates } = await database.query({
      currentRates: {},
    });

    // 第二步：只刪除本次爬取銀行的舊數據（保留其他銀行的數據）
    const deleteTransactions = existingRates
      .filter((rate: any) => scrapedBankIds.includes(rate.bankId))
      .map((rate: any) => database.tx.currentRates[rate.id].delete());

    if (deleteTransactions.length > 0) {
      await database.transact(deleteTransactions);
      console.log(`✅ 已刪除 ${deleteTransactions.length} 筆舊數據（僅更新的銀行）`);
    }

    // 顯示保留的銀行數據
    const preservedBanks = [...new Set(existingRates
      .filter((rate: any) => !scrapedBankIds.includes(rate.bankId))
      .map((rate: any) => rate.bankId))];
    if (preservedBanks.length > 0) {
      console.log(`ℹ️  保留其他銀行的舊數據: ${preservedBanks.join(', ')}`);
    }

    // 第三步：寫入新數據
    const insertTransactions = currentRates.map(rate => {
      const rateId = id(); // 生成新的 UUID
      return database.tx.currentRates[rateId].update(rate);
    });

    const result = await database.transact(insertTransactions);
    console.log(`✅ 成功寫入 ${currentRates.length} 筆當前匯率`);
    console.log(`📋 Transaction ID: ${result['tx-id']}`);
  } catch (error) {
    console.error('❌ 寫入 InstantDB 失敗:', error);
    throw error;
  }
}

/**
 * 寫入歷史匯率到 InstantDB
 */
export async function writeHistoricalRates(rates: ScrapedRate[]): Promise<void> {
  const database = getDB();
  const historicalRates = rates.map(convertToHistoricalRate);

  console.log(`\n📝 準備寫入 ${historicalRates.length} 筆歷史匯率到 InstantDB...`);

  try {
    // 使用 transact 批量寫入
    const transactions = historicalRates.map(rate => {
      const rateId = id(); // 生成唯一 ID
      return database.tx.historicalRates[rateId].update(rate);
    });

    const result = await database.transact(transactions);
    console.log(`✅ 成功寫入 ${historicalRates.length} 筆歷史匯率`);
    console.log(`📋 Transaction ID: ${result['tx-id']}`);
  } catch (error) {
    console.error('❌ 寫入 InstantDB 失敗:', error);
    throw error;
  }
}

/**
 * 保存到本地 JSON 文件（測試用）
 */
export async function saveToJsonFile(rates: ScrapedRate[], filename: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const outputDir = path.join(process.cwd(), 'scraper', 'test-output');
  
  // 確保目錄存在
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    // 目錄已存在
  }

  const filepath = path.join(outputDir, filename);
  const data = {
    scrapedAt: new Date().toISOString(),
    totalRates: rates.length,
    rates: rates,
  };

  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 數據已保存到: ${filepath}`);
}
