import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function debugJDBIframe() {
  console.log('🔍 調試 JDB iframe 頁面...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = 'https://www.jdbbank.com.la/exchange/exchange_all.php';
    console.log(`📡 訪問: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('⏳ 等待 5 秒...');
    await page.waitForTimeout(5000);

    // 保存 HTML
    const html = await page.content();
    const outputDir = path.join(process.cwd(), 'scraper', 'debug-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlPath = path.join(outputDir, 'jdb_iframe.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`💾 HTML 已保存到: ${htmlPath}`);

    // 截圖
    const screenshotPath = path.join(outputDir, 'jdb_iframe_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截圖已保存到: ${screenshotPath}`);

    // 查找表格
    const tables = await page.$$('table');
    console.log(`\n📊 找到 ${tables.length} 個表格\n`);

    for (let i = 0; i < tables.length; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`表格 ${i + 1}`);
      console.log('='.repeat(60));
      
      const table = tables[i];
      const rows = await table.$$('tr');
      console.log(`行數: ${rows.length}`);
      
      // 顯示前10行
      for (let j = 0; j < Math.min(10, rows.length); j++) {
        const row = rows[j];
        const cells = await row.$$('td, th');
        
        if (cells.length > 0) {
          const cellTexts = await Promise.all(
            cells.map(cell => cell.textContent())
          );
          const cleaned = cellTexts.map(t => t?.trim() || '');
          console.log(`  Row ${j + 1} (${cells.length} 列): ${JSON.stringify(cleaned)}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await browser.close();
  }
}

debugJDBIframe().catch(console.error);
