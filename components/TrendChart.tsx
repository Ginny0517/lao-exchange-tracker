'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useHistoricalRates } from '@/lib/db';
import type { HistoricalRate } from '@/lib/types';
import { mockBanks } from '@/lib/mockData';

interface TrendChartProps {
  currencyPair?: string;
  selectedBanks?: string[];
}

export default function TrendChart({
  currencyPair = 'USD/LAK',
  selectedBanks = [],
}: TrendChartProps) {
  // 從 InstantDB 獲取歷史數據（型別斷言以符合 HistoricalRate 結構）
  const { historicalRates, isLoading } = useHistoricalRates();
  const ratesList: HistoricalRate[] = historicalRates;

  const chartData = useMemo(() => {
    // 按日期分組數據
    const dataByDate = new Map<string, any>();

    ratesList
      .filter((rate) => rate.currencyPair === currencyPair)
      .filter((rate) => selectedBanks.length === 0 || selectedBanks.includes(rate.bankId))
      .forEach((rate) => {
        if (!dataByDate.has(rate.date)) {
          dataByDate.set(rate.date, { date: rate.date });
        }
        const dateData = dataByDate.get(rate.date)!;
        
        // 計算每天的平均價格
        if (!dateData[`${rate.bankId}_buy`]) {
          dateData[`${rate.bankId}_buy`] = [];
        }
        dateData[`${rate.bankId}_buy`].push(rate.buyPrice);
      });

    // 轉換為圖表數據格式
    const result = Array.from(dataByDate.values()).map((data) => {
      const processed: any = { date: data.date };
      
      mockBanks.forEach((bank) => {
        if (data[`${bank.bankId}_buy`]) {
          const prices = data[`${bank.bankId}_buy`];
          processed[bank.bankId] = Math.round(
            prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
          );
        }
      });
      
      return processed;
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [ratesList, currencyPair, selectedBanks]);

  const colors = [
    '#2196F3', // Primary
    '#00BCD4', // Accent
    '#4CAF50', // Success
    '#FF9800', // Orange
    '#9C27B0', // Purple
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const activeBanks = useMemo(() => {
    if (selectedBanks.length > 0) {
      return mockBanks.filter((bank) => selectedBanks.includes(bank.bankId));
    }
    return mockBanks;
  }, [selectedBanks]);

  // 載入狀態
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">載入歷史數據...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 transition-colors">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          7 日匯率走勢
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currencyPair} 買入價格趨勢
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-xs"
            stroke="currentColor"
          />
          <YAxis
            className="text-xs"
            stroke="currentColor"
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />
          {activeBanks.map((bank, index) => (
            <Line
              key={bank.bankId}
              type="monotone"
              dataKey={bank.bankId}
              name={bank.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {chartData.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            無歷史數據
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            當前篩選條件下沒有可用的歷史數據
          </p>
        </div>
      )}
    </div>
  );
}
