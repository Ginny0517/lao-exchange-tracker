'use client';

import { useState } from 'react';
import { mockBanks, mockPairs } from '@/lib/mockData';

interface FilterBarProps {
  onFilterChange?: (filters: {
    selectedPair: string;
    selectedBanks: string[];
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedPair, setSelectedPair] = useState('USD/LAK');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    onFilterChange?.({ selectedPair: pair, selectedBanks });
  };

  const toggleBank = (bankId: string) => {
    const newSelectedBanks = selectedBanks.includes(bankId)
      ? selectedBanks.filter((id) => id !== bankId)
      : [...selectedBanks, bankId];
    
    setSelectedBanks(newSelectedBanks);
    onFilterChange?.({ selectedPair, selectedBanks: newSelectedBanks });
  };

  const clearFilters = () => {
    setSelectedBanks([]);
    onFilterChange?.({ selectedPair, selectedBanks: [] });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* 匯率對選擇 */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            匯率對：
          </label>
          <div className="flex flex-wrap gap-2">
            {mockPairs.map((pair) => (
              <button
                key={pair.id}
                onClick={() => handlePairChange(pair.pair)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPair === pair.pair
                    ? 'bg-primary text-white shadow-md transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {pair.fromCurrency}/{pair.toCurrency}
              </button>
            ))}
          </div>
        </div>

        {/* 銀行篩選 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              篩選銀行
              {selectedBanks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-white rounded-full text-xs">
                  {selectedBanks.length}
                </span>
              )}
            </span>
          </button>

          {selectedBanks.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* 展開的銀行選擇 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {mockBanks.map((bank) => {
              const hasError = imageErrors.has(bank.bankId);
              return (
                <label
                  key={bank.id}
                  className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedBanks.includes(bank.bankId)}
                    onChange={() => toggleBank(bank.bankId)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {bank.logoUrl && !hasError ? (
                      <img
                        src={bank.logoUrl}
                        alt={bank.name}
                        className="w-full h-full object-contain"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(bank.bankId));
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {bank.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {bank.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
