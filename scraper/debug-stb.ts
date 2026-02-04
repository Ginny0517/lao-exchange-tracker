import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function debugSTB() {
  console.log('🔍 測試訪問 STB 網站...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = 'https://www.stbanklaos.la/';
    console.log(`📡 訪問: ${url}`);
    
    // 設置更長的超時時間
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    console.log('✅ 頁面加載成功！');
    console.log('⏳ 等待 5 秒讓頁面完全加載...');
    await page.waitForTimeout(5000);

    // 保存 HTML
    const html = await page.content();
    const outputDir = path.join(process.cwd(), 'scraper', 'debug-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlPath = path.join(outputDir, 'stb_page.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`💾 HTML 已保存到: ${htmlPath}`);
    console.log(`   HTML 長度: ${html.length} 字符`);

    // 截圖
    const screenshotPath = path.join(outputDir, 'stb_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截圖已保存到: ${screenshotPath}`);

    // 查找匯率相關元素
    console.log('\n🔍 搜索匯率數據...');
    
    // 搜索 USD, THB, CNY, EUR
    const currencies = ['USD', 'THB', 'CNY', 'EUR'];
    for (const curr of currencies) {
      const elements = await page.$$(`text=${curr}`);
      if (elements.length > 0) {
        console.log(`  ✓ 找到 "${curr}": ${elements.length} 個元素`);
      }
    }

    // 查找包含「買入」「賣出」的元素
    const buyElements = await page.$$('text=ຊື້');  // 寮語「買」
    const sellElements = await page.$$('text=ຂາຍ'); // 寮語「賣」
    console.log(`  ✓ 買入元素: ${buyElements.length} 個`);
    console.log(`  ✓ 賣出元素: ${sellElements.length} 個`);

    // 查找所有包含數字的元素（可能是匯率）
    console.log('\n💰 查找可能的匯率數據...');
    const rateTexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results: string[] = [];
      elements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        // 查找格式像 "21,409" 的數字
        if (/\d{2,}[,.]?\d+/.test(text) && text.length < 30) {
          results.push(text);
        }
      });
      return [...new Set(results)].slice(0, 20); // 去重並取前20個
    });
    
    rateTexts.forEach((text, i) => {
      console.log(`  ${i + 1}. ${text}`);
    });

  } catch (error) {
    console.error(`❌ 錯誤: ${error}`);
    
    if (error instanceof Error) {
      if (error.message.includes('Timeout')) {
        console.error('\n⚠️  網站訪問超時 - 可能需要 VPN 或網站暫時無法訪問');
      } else if (error.message.includes('net::ERR')) {
        console.error('\n⚠️  網絡錯誤 - 網站可能被阻擋或需要 VPN');
      }
    }
  } finally {
    await browser.close();
  }
}

debugSTB().catch(console.error);
