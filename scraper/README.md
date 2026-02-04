# 銀行匯率爬蟲系統

## 目錄結構

```
scraper/
├── scrapers/           # 各銀行爬蟲實現
│   ├── bol.ts         # Bank of Laos
│   ├── bcel.ts        # BCEL
│   ├── ldb.ts         # LDB
│   ├── apb.ts         # APB
│   └── jdb.ts         # JDB
├── lib/               # 共用工具
│   ├── types.ts       # 類型定義
│   ├── validator.ts   # 數據驗證
│   └── instantdb.ts   # InstantDB 寫入
├── test-output/       # 測試輸出目錄
└── index.ts           # 主入口
```

## 使用方式

### 測試單一銀行
```bash
npm run scrape:bol
```

### 爬取所有銀行
```bash
npm run scrape:all
```

### 測試模式（僅輸出到文件）
```bash
npm run scrape:test
```

## 環境變數

需要在 `.env.local` 中配置：
```
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
```
