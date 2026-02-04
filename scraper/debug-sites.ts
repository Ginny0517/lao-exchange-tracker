import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function debugSite(url: string, bankName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 調試: ${bankName}`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 等待頁面加載
    await page.waitForTimeout(5000);

    // 獲取頁面HTML
    const html = await page.content();
    console.log(`✅ 頁面加載成功 (${html.length} 字符)`);

    // 保存HTML到文件
    const outputDir = path.join(process.cwd(), 'scraper', 'debug-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlPath = path.join(outputDir, `${bankName.toLowerCase()}_page.html`);
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`💾 HTML已保存到: ${htmlPath}`);

    // 截圖
    const screenshotPath = path.join(outputDir, `${bankName.toLowerCase()}_screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截圖已保存到: ${screenshotPath}`);

    // 查找所有表格
    const tables = await page.$$('table');
    console.log(`\n📊 找到 ${tables.length} 個表格`);

    for (let i = 0; i < tables.length; i++) {
      console.log(`\n表格 ${i + 1}:`);
      
      // 獲取表格的 HTML
      const tableHtml = await tables[i].evaluate(el => el.outerHTML);
      console.log(`  - HTML長度: ${tableHtml.length} 字符`);
      
      // 獲取表格的 class 和 id
      const tableClass = await tables[i].getAttribute('class');
      const tableId = await tables[i].getAttribute('id');
      if (tableClass) console.log(`  - Class: ${tableClass}`);
      if (tableId) console.log(`  - ID: ${tableId}`);
      
      // 獲取行數
      const rows = await tables[i].$$('tr');
      console.log(`  - 行數: ${rows.length}`);
      
      // 顯示前幾行的文本
      if (rows.length > 0) {
        console.log(`  - 前5行內容:`);
        for (let j = 0; j < Math.min(5, rows.length); j++) {
          const rowText = await rows[j].evaluate(el => el.textContent);
          console.log(`    Row ${j + 1}: ${rowText?.trim().substring(0, 100)}`);
        }
      }
    }

    // 查找包含特定關鍵字的元素
    const keywords = ['USD', 'THB', 'CNY', 'EUR', 'Exchange', 'Rate', 'ອັດຕາ'];
    console.log(`\n🔍 搜索關鍵字...`);
    
    for (const keyword of keywords) {
      const elements = await page.$$(`text=${keyword}`);
      if (elements.length > 0) {
        console.log(`  ✓ 找到 "${keyword}": ${elements.length} 個元素`);
      }
    }

    // 查找所有包含數字的 div 或 td
    const allText = await page.evaluate(() => {
      const elements = document.querySelectorAll('td, div, span');
      const results: string[] = [];
      elements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        // 查找包含數字和可能是匯率的文本
        if (/\d{2,}/.test(text) && text.length < 50) {
          results.push(text);
        }
      });
      return results.slice(0, 50); // 只取前50個
    });
    
    console.log(`\n💰 可能的匯率數據（前20個）:`);
    allText.slice(0, 20).forEach((text, i) => {
      console.log(`  ${i + 1}. ${text}`);
    });

  } catch (error) {
    console.error(`❌ 錯誤: ${error}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🚀 開始調試銀行網站...\n');

  await debugSite('https://www.jdbbank.com.la/exchange-rates/', 'JDB');
  await debugSite('https://www.ldblao.la/interest?tab=3', 'LDB');

  console.log('\n✅ 調試完成！');
}

main().catch(console.error);
