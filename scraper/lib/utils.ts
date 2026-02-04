/**
 * 通用工具函數
 */

import { Page } from 'playwright';

/**
 * 等待隨機時間（避免被識別為機器人）
 */
export async function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 安全地獲取元素文本
 */
export async function safeGetText(page: Page, selector: string): Promise<string | null> {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    return await element.textContent();
  } catch (error) {
    return null;
  }
}

/**
 * 安全地獲取多個元素的文本
 */
export async function safeGetAllText(page: Page, selector: string): Promise<string[]> {
  try {
    const elements = await page.$$(selector);
    return await Promise.all(elements.map(el => el.textContent().then(t => t || '')));
  } catch (error) {
    return [];
  }
}

/**
 * 等待元素出現（帶超時）
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 日誌記錄工具
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    console.log(`[${this.context}] ℹ️  ${message}`);
  }

  success(message: string): void {
    console.log(`[${this.context}] ✅ ${message}`);
  }

  warning(message: string): void {
    console.log(`[${this.context}] ⚠️  ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[${this.context}] ❌ ${message}`);
    if (error) {
      console.error(`[${this.context}]    詳情: ${error.message}`);
    }
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      console.log(`[${this.context}] 🐛 ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
}

/**
 * 重試機制包裝器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        console.log(`重試 ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError!;
}

/**
 * 格式化時間戳
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 清理文本（移除多餘空白）
 */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
