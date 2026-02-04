# 部署到 Vercel

## 方式一：透過 Vercel 網站（推薦）

1. **登入 Vercel**  
   前往 [vercel.com](https://vercel.com) 並用 GitHub 登入。

2. **匯入專案**  
   - 點「Add New…」→「Project」  
   - 選擇 **Ginny0517/lao-exchange-tracker**（或你的 GitHub 帳號下的該 repo）  
   - 若未列出，點「Import Git Repository」並授權 Vercel 存取 GitHub。

3. **設定環境變數**  
   在專案設定頁的 **Environment Variables** 新增：
   - **Name:** `NEXT_PUBLIC_INSTANT_APP_ID`  
   - **Value:** 你的 InstantDB App ID（與本機 `.env.local` 相同）  
   - 環境勾選：Production、Preview、Development（建議）

4. **部署**  
   - 直接點「Deploy」  
   - 等待建置完成，Vercel 會給你一個網址，例如：  
     `https://lao-exchange-tracker-xxx.vercel.app`

---

## 方式二：使用 Vercel CLI

1. **在專案目錄執行**（本專案已含 `vercel` devDependency，可直接用 `npx`）
   ```bash
   cd "c:\Users\kevin\OneDrive\文件\Laos exchange rates"
   npm install
   npx vercel login
   npx vercel
   ```
   第一次會詢問專案設定，依提示操作；環境變數可在提示時加入，或到 Vercel 網站補填。

2. **正式上線（Production）**
   ```bash
   npx vercel --prod
   ```
   或使用腳本：
   ```bash
   npm run deploy
   ```
   （預覽部署：`npm run deploy:preview`）

---

## 環境變數說明

| 變數名稱 | 必填 | 說明 |
|----------|------|------|
| `NEXT_PUBLIC_INSTANT_APP_ID` | 是 | InstantDB 的 App ID，前端讀取匯率用 |

`INSTANT_ADMIN_TOKEN` 僅爬蟲在本機使用，**不需要**在 Vercel 設定。

---

## 注意事項

- 程式碼推送到 GitHub 的 `main`（或你連結的分支）後，Vercel 會自動重新部署。
- 若建置失敗，請在 Vercel 專案的「Deployments」點進該次部署，查看「Building」的錯誤日誌。
