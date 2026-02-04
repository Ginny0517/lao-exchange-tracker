'use client';

import { useState, useMemo } from 'react';
import { useCurrentRates } from '@/lib/db';
import { mockBanks } from '@/lib/mockData';
import { CurrentRate } from '@/lib/types';

interface ExchangeTableProps {
  selectedPair?: string;
  selectedBanks?: string[];
}

export default function ExchangeTable({
  selectedPair = 'USD/LAK',
  selectedBanks = [],
}: ExchangeTableProps) {
  const [sortBy, setSortBy] = useState<'buyPrice' | 'sellPrice' | 'spread'>('buyPrice');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // 從 InstantDB 獲取實時數據（InstantDB 回傳型別與實體不一致，在此斷言為 CurrentRate[]）
  const { currentRates, isLoading } = useCurrentRates();
  const ratesList = currentRates as CurrentRate[];

  // 篩選和排序數據
  const filteredRates = useMemo(() => {
    let rates = ratesList.filter((rate) => rate.currencyPair === selectedPair);

    if (selectedBanks.length > 0) {
      rates = rates.filter((rate) => selectedBanks.includes(rate.bankId));
    }

    return rates.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [ratesList, selectedPair, selectedBanks, sortBy, sortOrder]);

  const handleSort = (column: 'buyPrice' | 'sellPrice' | 'spread') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: 'buyPrice' | 'sellPrice' | 'spread' }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getBestValue = (type: 'buy' | 'sell') => {
    if (filteredRates.length === 0) return null;
    
    if (type === 'buy') {
      return Math.max(...filteredRates.map(r => r.buyPrice));
    } else {
      return Math.min(...filteredRates.map(r => r.sellPrice));
    }
  };

  const bestBuy = getBestValue('buy');
  const bestSell = getBestValue('sell');

  // 根據 bankId 獲取銀行信息
  const getBankInfo = (bankId: string) => {
    return mockBanks.find(bank => bank.bankId === bankId);
  };

  // 載入狀態
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-colors">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">載入匯率數據...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-colors">
      {/* 響應式表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                銀行
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('buyPrice')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>買入價</span>
                  <SortIcon column="buyPrice" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('sellPrice')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>賣出價</span>
                  <SortIcon column="sellPrice" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('spread')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>價差</span>
                  <SortIcon column="spread" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                24h 變化
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRates.map((rate) => (
              <tr
                key={rate.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {(() => {
                      const bankInfo = getBankInfo(rate.bankId);
                      const logoUrl = bankInfo?.logoUrl || '';
                      const hasError = imageErrors.has(rate.bankId);
                      
                      return (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                          {logoUrl && !hasError ? (
                            <img
                              src={logoUrl}
                              alt={rate.bankName}
                              className="w-full h-full object-contain"
                              onError={() => {
                                setImageErrors(prev => new Set(prev).add(rate.bankId));
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {rate.bankName}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {rate.bankName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`text-sm font-semibold ${
                      rate.buyPrice === bestBuy
                        ? 'text-success'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatNumber(rate.buyPrice)}
                    {rate.buyPrice === bestBuy && (
                      <span className="ml-1 text-xs">👑</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`text-sm font-semibold ${
                      rate.sellPrice === bestSell
                        ? 'text-success'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatNumber(rate.sellPrice)}
                    {rate.sellPrice === bestSell && (
                      <span className="ml-1 text-xs">👑</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatNumber(rate.spread)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rate.percentChange24h > 0
                        ? 'bg-success bg-opacity-10 text-success'
                        : rate.percentChange24h < 0
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {rate.percentChange24h > 0 ? '+' : ''}
                    {rate.percentChange24h.toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRates.length === 0 && (
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            無匯率數據
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            當前篩選條件下沒有可用的匯率數據
          </p>
        </div>
      )}
    </div>
  );
}
