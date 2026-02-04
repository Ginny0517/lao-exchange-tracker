import { chromium } from 'playwright';

async function debugJDB() {
  console.log('🔍 深度調試 JDB 網站...\n');

  const browser = await chromium.launch({ headless: false }); // 使用可見模式
  const page = await browser.newPage();

  try {
    console.log('📡 訪問 JDB 匯率頁面...');
    await page.goto('https://www.jdbbank.com.la/exchange-rates/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    console.log('⏳ 等待 10 秒讓頁面完全加載...');
    await page.waitForTimeout(10000);

    // 查找所有可能包含匯率的元素
    console.log('\n🔍 查找包含數字的元素...');
    
    // 查找所有可能的表格或列表
    const possibleContainers = await page.$$('table, .exchange, .rate, [class*="exchange"], [class*="rate"], [id*="exchange"], [id*="rate"]');
    console.log(`找到 ${possibleContainers.length} 個可能的容器`);

    for (let i = 0; i < possibleContainers.length; i++) {
      const container = possibleContainers[i];
      const tagName = await container.evaluate(el => el.tagName);
      const className = await container.getAttribute('class') || '';
      const id = await container.getAttribute('id') || '';
      const text = await container.textContent();
      
      console.log(`\n容器 ${i + 1}:`);
      console.log(`  - 標籤: ${tagName}`);
      console.log(`  - Class: ${className}`);
      console.log(`  - ID: ${id}`);
      console.log(`  - 內容預覽: ${text?.substring(0, 200)}`);
    }

    // 查找所有包含 "USD", "THB", "CNY", "EUR" 的元素
    console.log('\n🔍 搜索幣種關鍵字...');
    const currencies = ['USD', 'THB', 'CNY', 'EUR'];
    
    for (const curr of currencies) {
      const elements = await page.$$(`text=${curr}`);
      console.log(`\n${curr}: 找到 ${elements.length} 個元素`);
      
      for (let i = 0; i < Math.min(3, elements.length); i++) {
        const el = elements[i];
        const parent = await el.evaluateHandle(e => e.parentElement);
        const parentText = await parent.evaluate(e => e?.textContent || '');
        console.log(`  ${i + 1}. 父元素內容: ${parentText.trim().substring(0, 100)}`);
      }
    }

    // 檢查是否有 iframe
    console.log('\n🔍 檢查 iframe...');
    const frames = page.frames();
    console.log(`找到 ${frames.length} 個 frame`);
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameUrl = frame.url();
      console.log(`  Frame ${i + 1}: ${frameUrl}`);
      
      if (frameUrl && !frameUrl.includes('about:blank')) {
        try {
          const frameTables = await frame.$$('table');
          console.log(`    - 表格數: ${frameTables.length}`);
        } catch (e) {
          console.log(`    - 無法訪問此 frame`);
        }
      }
    }

    // 查看網頁中所有的鏈接，看是否有指向實際匯率頁面的鏈接
    console.log('\n🔍 查找匯率相關鏈接...');
    const links = await page.$$('a[href*="rate"], a[href*="exchange"]');
    console.log(`找到 ${links.length} 個相關鏈接`);
    
    for (let i = 0; i < Math.min(10, links.length); i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`  ${i + 1}. ${text?.trim()} -> ${href}`);
    }

    console.log('\n⏸️  瀏覽器將保持開啟 30 秒，請手動檢查頁面...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await browser.close();
  }
}

debugJDB().catch(console.error);
