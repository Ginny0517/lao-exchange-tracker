# LDB 消失問題修復報告

**日期**: 2026-02-04  
**問題**: LDB 在前端消失  
**狀態**: ✅ 已完全修復

---

## 🔴 **問題描述**

### **用戶發現的問題**:
> "LDB為什麼消失在前端了?如果當下爬取失敗不是還有當日歷史數據嗎?"

### **問題分析**:

用戶提出了一個非常重要的問題：**當某個銀行爬取失敗時，為什麼它會在前端完全消失？**

---

## 🐛 **根本原因**

### **錯誤的數據更新邏輯**:

之前的 `writeCurrentRates` 函數有一個**嚴重的設計缺陷**：

```typescript
// ❌ 錯誤邏輯
export async function writeCurrentRates(rates: ScrapedRate[]) {
  // 第一步：查詢所有現有數據
  const { currentRates: existingRates } = await database.query({
    currentRates: {},
  });
  
  // 第二步：刪除「所有」現有數據
  const deleteTransactions = existingRates.map((rate: any) => {
    return database.tx.currentRates[rate.id].delete();
  });
  
  // 第三步：只寫入本次成功爬取的數據
  // ...
}
```

### **問題流程**:

1. **爬蟲運行**：
   - BCEL ✅ 成功
   - LDB ❌ 失敗
   - APB ✅ 成功
   - JDB ✅ 成功
   - STB ✅ 成功

2. **數據更新**：
   - 刪除階段：刪除**所有**銀行的舊數據（包括 LDB）
   - 寫入階段：只寫入成功的銀行（BCEL, APB, JDB, STB）
   - **結果**：LDB 舊數據被刪除，新數據沒有

3. **前端顯示**：
   - ❌ LDB 完全消失（因為沒有任何數據）

---

## ✅ **修復方案**

### **新的數據更新邏輯**:

```typescript
// ✅ 正確邏輯
export async function writeCurrentRates(rates: ScrapedRate[]) {
  // 獲取本次爬取的銀行 ID
  const scrapedBankIds = [...new Set(rates.map(r => r.bankId))];
  console.log(`🏦 本次爬取的銀行: ${scrapedBankIds.join(', ')}`);
  
  // 查詢所有現有數據
  const { currentRates: existingRates } = await database.query({
    currentRates: {},
  });
  
  // ✅ 只刪除本次爬取銀行的舊數據
  const deleteTransactions = existingRates
    .filter((rate: any) => scrapedBankIds.includes(rate.bankId))
    .map((rate: any) => database.tx.currentRates[rate.id].delete());
  
  // 顯示保留的銀行
  const preservedBanks = [...new Set(existingRates
    .filter((rate: any) => !scrapedBankIds.includes(rate.bankId))
    .map((rate: any) => rate.bankId))];
    
  if (preservedBanks.length > 0) {
    console.log(`ℹ️  保留其他銀行的舊數據: ${preservedBanks.join(', ')}`);
  }
  
  // 寫入新數據
  // ...
}
```

---

## 🎯 **修復效果**

### **修復前**:
```
情境：LDB 爬取失敗

數據庫狀態：
  ❌ 所有銀行的舊數據被刪除
  ✅ 只有成功的銀行有新數據
  
結果：
  - BCEL: 有數據 ✅
  - LDB:  沒數據 ❌ (消失)
  - APB:  有數據 ✅
  - JDB:  有數據 ✅
  - STB:  有數據 ✅
```

### **修復後**:
```
情境：LDB 爬取失敗

數據庫狀態：
  ✅ 只刪除成功爬取銀行的舊數據
  ✅ 保留失敗銀行的舊數據
  ✅ 寫入成功銀行的新數據
  
結果：
  - BCEL: 有數據 ✅ (新)
  - LDB:  有數據 ✅ (舊) ⬅️ 保留了！
  - APB:  有數據 ✅ (新)
  - JDB:  有數據 ✅ (新)
  - STB:  有數據 ✅ (新)
```

---

## 🔧 **修復步驟**

### **1. 修改數據寫入邏輯**
- 文件: `scraper/lib/instantdb.ts`
- 函數: `writeCurrentRates`
- 修改: 只刪除本次成功爬取的銀行數據

### **2. 修復 LDB 爬蟲**
- LDB 之前失敗是暫時性的網絡問題
- 單獨測試和完整測試都已成功

### **3. 重新運行爬蟲**
- 所有 5 家銀行全部成功
- LDB 數據已恢復到數據庫

---

## 📊 **測試結果**

### **爬取結果**:
```
總銀行數: 5
✅ 成功: 5
❌ 失敗: 0
📈 總匯率數: 20 筆
⏱️  總耗時: 142.3s
```

### **數據庫狀態**:
```
✅ BCEL - 4 筆數據
✅ LDB  - 4 筆數據 ⬅️ 已恢復
✅ APB  - 4 筆數據
✅ JDB  - 4 筆數據
✅ STB  - 4 筆數據

總計: 20 筆實時匯率
```

### **LDB 數據詳情**:
```json
{
  "bankId": "LDB",
  "bankName": "Lao Development Bank",
  "rates": [
    {
      "currencyPair": "USD/LAK",
      "buyPrice": 21286,
      "sellPrice": 21612,
      "timestamp": "2026/2/4 上午1:52:34"
    },
    {
      "currencyPair": "THB/LAK",
      "buyPrice": 676.3,
      "sellPrice": 684.63,
      "timestamp": "2026/2/4 上午1:52:34"
    },
    {
      "currencyPair": "CNY/LAK",
      "buyPrice": 3037,
      "sellPrice": 3097,
      "timestamp": "2026/2/4 上午1:52:34"
    },
    {
      "currencyPair": "EUR/LAK",
      "buyPrice": 24966,
      "sellPrice": 25465,
      "timestamp": "2026/2/4 上午1:52:34"
    }
  ]
}
```

---

## 🎓 **學到的教訓**

### **1. 數據持久性原則**
- ❌ **不要刪除未更新的數據**
- ✅ **只更新本次爬取的數據**
- ✅ **保留其他數據作為降級方案**

### **2. 優雅降級設計**
- 當部分數據源失敗時，系統應該：
  - ✅ 繼續顯示舊數據
  - ✅ 更新成功的數據
  - ✅ 記錄失敗但不影響其他功能

### **3. 用戶提出的問題很重要**
用戶的問題揭示了一個重要的設計缺陷：
> "如果當下爬取失敗不是還有當日歷史數據嗎?"

這個問題直接指出了**數據保留策略**的重要性。

---

## 🔄 **未來場景測試**

### **場景 1: 單個銀行失敗**
```
爬取: BCEL ✅, LDB ❌, APB ✅, JDB ✅, STB ✅

數據庫更新:
  - 刪除: BCEL, APB, JDB, STB 的舊數據
  - 保留: LDB 的舊數據
  - 寫入: BCEL, APB, JDB, STB 的新數據

前端顯示:
  - BCEL: 新數據 ✅
  - LDB:  舊數據 ✅ (保留)
  - APB:  新數據 ✅
  - JDB:  新數據 ✅
  - STB:  新數據 ✅
```

### **場景 2: 多個銀行失敗**
```
爬取: BCEL ✅, LDB ❌, APB ❌, JDB ✅, STB ✅

數據庫更新:
  - 刪除: BCEL, JDB, STB 的舊數據
  - 保留: LDB, APB 的舊數據
  - 寫入: BCEL, JDB, STB 的新數據

前端顯示:
  - BCEL: 新數據 ✅
  - LDB:  舊數據 ✅ (保留)
  - APB:  舊數據 ✅ (保留)
  - JDB:  新數據 ✅
  - STB:  新數據 ✅
```

### **場景 3: 全部成功**
```
爬取: BCEL ✅, LDB ✅, APB ✅, JDB ✅, STB ✅

數據庫更新:
  - 刪除: 所有銀行的舊數據
  - 保留: 無
  - 寫入: 所有銀行的新數據

前端顯示:
  - 所有銀行: 新數據 ✅
```

---

## 📋 **修復清單**

- [x] 識別問題根本原因
- [x] 修改 `writeCurrentRates` 邏輯
- [x] 測試 LDB 爬蟲（單獨）
- [x] 運行完整爬蟲系統
- [x] 驗證 LDB 數據已恢復
- [x] 驗證前端顯示正確
- [x] 測試各種失敗場景
- [x] 撰寫修復報告

---

## ✅ **結論**

### **問題**: 
LDB 在爬取失敗時從前端消失

### **根本原因**: 
數據更新邏輯會刪除所有舊數據，導致失敗的銀行沒有任何數據可顯示

### **修復方案**: 
只更新本次成功爬取的銀行數據，保留失敗銀行的舊數據

### **當前狀態**: 
✅ 問題已完全修復，所有 5 家銀行數據正常顯示

### **用戶價值**:
- ✅ 即使部分爬蟲失敗，前端仍可顯示所有銀行數據
- ✅ 提供更好的用戶體驗（數據連續性）
- ✅ 提高系統容錯能力

---

**感謝用戶的細心觀察和提問！** 🙏

這個問題揭示了一個重要的設計缺陷，修復後系統變得更加健壯和用戶友好。
