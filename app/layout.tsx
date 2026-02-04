import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "老撾銀行匯率對比 - 實時匯率查詢",
  description: "實時查詢老撾各大銀行的匯率信息，包括 USD、THB、CNY、EUR 等幣種對 LAK 的匯率。提供歷史走勢圖表和最佳匯率推薦。",
  keywords: "老撾,寮國,匯率,銀行,LAK,USD,THB,CNY,exchange rate,Laos",
  authors: [{ name: "Laos Bank Rates" }],
  openGraph: {
    title: "老撾銀行匯率對比",
    description: "實時查詢老撾各大銀行的匯率信息",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2196F3" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {children}
        </div>
      </body>
    </html>
  );
}
