# 老撾銀行匯率對比工具

基於 Next.js 14 + InstantDB 建立的實時銀行匯率對比平台。

## 功能特點

- ✨ 實時匯率查詢（USD, THB, CNY, EUR 等對 LAK）
- 📊 7 日歷史走勢圖表
- 🏦 支持多家老撾銀行對比
- 🌓 深色模式支持
- 🌍 多語言支持（繁中、英文、寮文）
- 📱 響應式設計（Mobile-first）
- ⚡ 快速加載和實時更新

## 技術棧

- **前端框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **數據庫**: InstantDB
- **UI 樣式**: TailwindCSS
- **圖表**: Recharts
- **部署**: Vercel

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製 `.env.local.example` 為 `.env.local`：

```bash
cp .env.local.example .env.local
```

然後在 `.env.local` 中填入您的 InstantDB App ID：

```
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id_here
```

要獲取 App ID，請前往 [InstantDB](https://instantdb.com) 註冊並創建應用。

### 3. 運行開發服務器

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看應用。

## 項目結構

```
web/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # 全局佈局
│   ├── page.tsx           # 主頁
│   └── globals.css        # 全局樣式
├── components/            # React 組件
│   ├── Header.tsx         # 頁面頭部
│   ├── FilterBar.tsx      # 篩選欄
│   ├── ExchangeTable.tsx  # 匯率表格
│   ├── TrendChart.tsx     # 走勢圖表
│   └── StatsCard.tsx      # 統計卡片
├── lib/                   # 核心邏輯
│   ├── db.ts             # InstantDB 配置
│   ├── schema.ts         # 數據模型
│   ├── types.ts          # TypeScript 類型
│   └── mockData.ts       # 模擬數據
├── public/               # 靜態資源
└── package.json          # 項目配置
```

## InstantDB Schema

### currentRates (當前匯率)
- bankId, bankName, currencyPair
- buyPrice, sellPrice, spread
- percentChange24h, timestamp

### historicalRates (歷史匯率)
- bankId, currencyPair
- buyPrice, sellPrice
- date, hour, timestamp

### banks (銀行信息)
- bankId, name, fullName
- website, logoUrl
- isActive, priority

### supportedPairs (支持的匯率對)
- pair, fromCurrency, toCurrency
- displayName, isActive

## 開發說明

### 添加新銀行

1. 在 `lib/mockData.ts` 中添加銀行數據
2. 更新 InstantDB 的 `banks` 表

### 添加新匯率對

1. 在 `lib/mockData.ts` 中添加貨幣對
2. 更新 InstantDB 的 `supportedPairs` 表

### 自定義主題

修改 `tailwind.config.ts` 中的顏色配置。

## 部署

### Vercel（推薦）

```bash
npm run build
```

然後連接 GitHub 倉庫到 Vercel 進行自動部署。

### 其他平台

本項目支持任何 Node.js 托管平台。

## 授權

MIT License

## 聯繫方式

如有問題，請提交 Issue。
