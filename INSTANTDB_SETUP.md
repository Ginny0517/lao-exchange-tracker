# InstantDB 配置指南

## 📋 獲取 Admin Token

要使用爬蟲寫入數據到 InstantDB，您需要配置 Admin Token：

### 步驟 1: 登入 InstantDB
前往 [https://instantdb.com/dash](https://instantdb.com/dash) 並登入您的帳號。

### 步驟 2: 選擇您的應用
在控制台中選擇您的應用（App ID: `1b1412f9-4ce2-4d94-aed3-4c7a99feb19e`）

### 步驟 3: 獲取 Admin Token
1. 進入應用設置頁面
2. 找到 **Admin Token** 或 **API Keys** 區域
3. 複製 Admin Token（通常以 `sk_` 開頭）

### 步驟 4: 配置環境變數
將 Admin Token 添加到 `.env.local` 文件：

```bash
# .env.local
NEXT_PUBLIC_INSTANT_APP_ID=1b1412f9-4ce2-4d94-aed3-4c7a99feb19e
INSTANT_ADMIN_TOKEN=your_admin_token_here
```

⚠️ **重要提示**: 
- Admin Token 擁有完整的資料庫權限，務必保密！
- 不要將 Admin Token 提交到 Git
- `.env.local` 已在 `.gitignore` 中

## 🧪 測試 InstantDB 連接

配置完成後，運行測試腳本：

```bash
npm run scrape:test
```

如果配置正確，您應該看到數據成功寫入 InstantDB。

## 📊 驗證數據

在前端應用中驗證數據：

1. 啟動開發服務器：`npm run dev`
2. 訪問 http://localhost:3000
3. 檢查是否顯示從 InstantDB 讀取的實時數據

## 🔍 當前配置狀態

- ✅ App ID 已配置
- ⏳ Admin Token 待配置

## 🆘 故障排除

### 錯誤: "InstantDB 配置不完整"
- 確認 `.env.local` 文件存在於項目根目錄
- 確認文件中包含 `INSTANT_ADMIN_TOKEN=...`
- 重啟開發服務器或爬蟲腳本

### 錯誤: "Unauthorized" 或 "Invalid token"
- 確認 Admin Token 正確複製（沒有多餘空格）
- 確認 Token 來自正確的應用
- 確認 Token 尚未過期或撤銷

### 數據沒有顯示在前端
- 檢查 InstantDB 控制台中的數據
- 確認前端使用的是正確的 App ID
- 檢查瀏覽器控制台是否有錯誤
