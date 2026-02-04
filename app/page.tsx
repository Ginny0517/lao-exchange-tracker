'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import StatsCard from '@/components/StatsCard';
import ExchangeTable from '@/components/ExchangeTable';
import TrendChart from '@/components/TrendChart';
import { useCurrentRates } from '@/lib/db';

export default function Home() {
  const [selectedPair, setSelectedPair] = useState('USD/LAK');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  // 從 InstantDB 獲取實時數據
  const { currentRates, isLoading, error } = useCurrentRates();

  const handleFilterChange = (filters: {
    selectedPair: string;
    selectedBanks: string[];
  }) => {
    setSelectedPair(filters.selectedPair);
    setSelectedBanks(filters.selectedBanks);
  };

  // 計算統計數據
  const stats = useMemo(() => {
    const filteredRates = currentRates.filter(
      (rate) => rate.currencyPair === selectedPair
    );

    if (filteredRates.length === 0) {
      return {
        bestBuyRate: null,
        bestSellRate: null,
        averageSpread: 0,
        totalBanks: 0,
      };
    }

    const bestBuyRate = filteredRates.reduce((prev, current) =>
      current.buyPrice > prev.buyPrice ? current : prev
    );

    const bestSellRate = filteredRates.reduce((prev, current) =>
      current.sellPrice < prev.sellPrice ? current : prev
    );

    const averageSpread =
      filteredRates.reduce((sum, rate) => sum + rate.spread, 0) /
      filteredRates.length;

    return {
      bestBuyRate,
      bestSellRate,
      averageSpread,
      totalBanks: filteredRates.length,
    };
  }, [selectedPair, currentRates]);

  // 載入狀態
  if (isLoading) {
    return (
      <main>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <main>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">載入數據時發生錯誤</h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* 篩選欄 */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="最佳買入價"
            value={
              stats.bestBuyRate
                ? stats.bestBuyRate.buyPrice.toLocaleString()
                : 'N/A'
            }
            subtitle={stats.bestBuyRate?.bankName || ''}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            trend="up"
            trendValue={
              stats.bestBuyRate
                ? `${stats.bestBuyRate.percentChange24h > 0 ? '+' : ''}${stats.bestBuyRate.percentChange24h.toFixed(2)}%`
                : '0%'
            }
          />

          <StatsCard
            title="最佳賣出價"
            value={
              stats.bestSellRate
                ? stats.bestSellRate.sellPrice.toLocaleString()
                : 'N/A'
            }
            subtitle={stats.bestSellRate?.bankName || ''}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            }
            trend="down"
            trendValue={
              stats.bestSellRate
                ? `${stats.bestSellRate.percentChange24h > 0 ? '+' : ''}${stats.bestSellRate.percentChange24h.toFixed(2)}%`
                : '0%'
            }
          />

          <StatsCard
            title="平均價差"
            value={stats.averageSpread.toFixed(0)}
            subtitle="LAK"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            }
            trend="neutral"
          />

          <StatsCard
            title="參與銀行"
            value={stats.totalBanks}
            subtitle={`${selectedPair} 匯率`}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
          />
        </div>

        {/* 匯率表格 */}
        <div className="mb-8">
          <ExchangeTable
            selectedPair={selectedPair}
            selectedBanks={selectedBanks}
          />
        </div>

        {/* 走勢圖表 */}
        <TrendChart
          currencyPair={selectedPair}
          selectedBanks={selectedBanks}
        />

        {/* 頁腳 */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              數據更新時間：{new Date().toLocaleString('zh-TW')}
            </p>
            <p>
              匯率僅供參考，實際交易請以各銀行公告為準
            </p>
            <p className="mt-4 text-xs">
              © 2026 老撾銀行匯率對比工具 | Powered by InstantDB + Next.js
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
