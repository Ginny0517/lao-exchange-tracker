/**
 * 數據驗證模組
 */

import { ScrapedRate, ValidationResult } from './types';

// 合理的匯率範圍（2026年2月參考值）
const RATE_RANGES = {
  'USD/LAK': { min: 18000, max: 25000 },
  'THB/LAK': { min: 500, max: 800 },
  'CNY/LAK': { min: 2800, max: 3500 },
  'EUR/LAK': { min: 23000, max: 28000 },
};

const VALID_CURRENCIES = ['USD', 'THB', 'CNY', 'EUR', 'LAK'];
const VALID_BANK_IDS = ['BCEL', 'LDB', 'APB', 'JDB', 'STB']; // 移除 BOL，添加 STB

/**
 * 驗證爬取的匯率數據
 */
export function validateRate(rate: Partial<ScrapedRate>): ValidationResult {
  const errors: string[] = [];

  // 1. 檢查必填欄位
  if (!rate.bankId) errors.push('缺少 bankId');
  if (!rate.currencyPair) errors.push('缺少 currencyPair');
  if (rate.buyPrice === undefined) errors.push('缺少 buyPrice');
  if (rate.sellPrice === undefined) errors.push('缺少 sellPrice');

  // 2. 驗證銀行 ID
  if (rate.bankId && !VALID_BANK_IDS.includes(rate.bankId)) {
    errors.push(`無效的銀行 ID: ${rate.bankId}`);
  }

  // 3. 驗證幣種
  if (rate.fromCurrency && !VALID_CURRENCIES.includes(rate.fromCurrency)) {
    errors.push(`無效的貨幣: ${rate.fromCurrency}`);
  }
  if (rate.toCurrency && !VALID_CURRENCIES.includes(rate.toCurrency)) {
    errors.push(`無效的貨幣: ${rate.toCurrency}`);
  }

  // 4. 驗證價格為正數
  if (rate.buyPrice !== undefined && rate.buyPrice <= 0) {
    errors.push(`買入價必須為正數: ${rate.buyPrice}`);
  }
  if (rate.sellPrice !== undefined && rate.sellPrice <= 0) {
    errors.push(`賣出價必須為正數: ${rate.sellPrice}`);
  }

  // 5. 驗證賣出價 >= 買入價
  if (rate.buyPrice && rate.sellPrice && rate.sellPrice < rate.buyPrice) {
    errors.push(`賣出價 (${rate.sellPrice}) 不能低於買入價 (${rate.buyPrice})`);
  }

  // 6. 驗證匯率在合理範圍內
  if (rate.currencyPair && rate.buyPrice) {
    const range = RATE_RANGES[rate.currencyPair as keyof typeof RATE_RANGES];
    if (range) {
      if (rate.buyPrice < range.min || rate.buyPrice > range.max) {
        errors.push(
          `匯率 ${rate.currencyPair} 超出合理範圍 (${range.min}-${range.max}): ${rate.buyPrice}`
        );
      }
    }
  }

  // 7. 驗證價差合理性
  if (rate.spread !== undefined) {
    const spreadPercent = rate.buyPrice ? (rate.spread / rate.buyPrice) * 100 : 0;
    if (spreadPercent > 5) {
      errors.push(`價差過大 (${spreadPercent.toFixed(2)}%): ${rate.spread}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (rate as ScrapedRate) : undefined,
  };
}

/**
 * 批量驗證
 */
export function validateRates(rates: Partial<ScrapedRate>[]): {
  valid: ScrapedRate[];
  invalid: Array<{ rate: Partial<ScrapedRate>; errors: string[] }>;
} {
  const valid: ScrapedRate[] = [];
  const invalid: Array<{ rate: Partial<ScrapedRate>; errors: string[] }> = [];

  for (const rate of rates) {
    const result = validateRate(rate);
    if (result.valid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ rate, errors: result.errors });
    }
  }

  return { valid, invalid };
}

/**
 * 格式化驗證報告
 */
export function formatValidationReport(
  valid: ScrapedRate[],
  invalid: Array<{ rate: Partial<ScrapedRate>; errors: string[] }>
): string {
  let report = `\n✅ 有效數據: ${valid.length} 筆\n`;
  
  if (invalid.length > 0) {
    report += `\n❌ 無效數據: ${invalid.length} 筆\n`;
    invalid.forEach(({ rate, errors }, index) => {
      report += `\n  ${index + 1}. ${rate.bankId} - ${rate.currencyPair}\n`;
      errors.forEach(err => {
        report += `     - ${err}\n`;
      });
    });
  }

  return report;
}
