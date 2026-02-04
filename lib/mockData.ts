// 模擬數據用於開發
import { CurrentRate, Bank, SupportedPair, HistoricalRate } from './types';

export const mockBanks: Bank[] = [
  {
    id: '1',
    bankId: 'BOL',
    name: 'BOL',
    fullName: 'Bank of Laos',
    website: 'https://bol.gov.la/ExchangRate.php',
    logoUrl: '/logos/bol.png',
    isActive: true,
    priority: 1,
  },
  {
    id: '2',
    bankId: 'BCEL',
    name: 'BCEL',
    fullName: 'Banque Pour Le Commerce Exterieur Lao',
    website: 'https://www.bcel.com.la/bcel/exchange-rate.html',
    logoUrl: '/logos/bcel.png',
    isActive: true,
    priority: 2,
  },
  {
    id: '3',
    bankId: 'LDB',
    name: 'LDB',
    fullName: 'Lao Development Bank',
    website: 'https://www.ldblao.la/interest?tab=3',
    logoUrl: '/logos/ldb.png',
    isActive: true,
    priority: 3,
  },
  {
    id: '4',
    bankId: 'APB',
    name: 'APB',
    fullName: 'Agricultural Promotion Bank',
    website: 'https://www.apb.com.la/',
    logoUrl: '/logos/apb.png',
    isActive: true,
    priority: 4,
  },
  {
    id: '5',
    bankId: 'JDB',
    name: 'JDB',
    fullName: 'Joint Development Bank',
    website: 'https://www.jdbbank.com.la/exchange-rates/',
    logoUrl: '/logos/jdb.png',
    isActive: true,
    priority: 5,
  },
  {
    id: '6',
    bankId: 'STB',
    name: 'STB',
    fullName: 'Siam Commercial Bank Laos',
    website: 'https://www.stbanklaos.la/',
    logoUrl: '/logos/stb.png',
    isActive: true,
    priority: 6,
  }
];

// 輔助函數：根據 bankId 獲取銀行名稱
const getBankName = (bankId: string): string => {
  const bank = mockBanks.find(b => b.bankId === bankId);
  return bank?.name || bankId;
};

export const mockPairs: SupportedPair[] = [
  {
    id: '1',
    pair: 'USD/LAK',
    fromCurrency: 'USD',
    toCurrency: 'LAK',
    displayName: '美元/老撾基普',
    isActive: true,
  },
  {
    id: '2',
    pair: 'THB/LAK',
    fromCurrency: 'THB',
    toCurrency: 'LAK',
    displayName: '泰銖/老撾基普',
    isActive: true,
  },
  {
    id: '3',
    pair: 'CNY/LAK',
    fromCurrency: 'CNY',
    toCurrency: 'LAK',
    displayName: '人民幣/老撾基普',
    isActive: true,
  },
  {
    id: '4',
    pair: 'EUR/LAK',
    fromCurrency: 'EUR',
    toCurrency: 'LAK',
    displayName: '歐元/老撾基普',
    isActive: true,
  },
];

export const mockCurrentRates: CurrentRate[] = [
  {
    id: '1',
    bankId: 'BOL',
    bankName: getBankName('BOL'),
    currencyPair: 'USD/LAK',
    buyPrice: 21850,
    sellPrice: 22050,
    spread: 200,
    percentChange24h: 0.15,
    timestamp: Date.now(),
  },
  {
    id: '2',
    bankId: 'BCEL',
    bankName: getBankName('BCEL'),
    currencyPair: 'USD/LAK',
    buyPrice: 21880,
    sellPrice: 22020,
    spread: 140,
    percentChange24h: 0.22,
    timestamp: Date.now(),
  },
  {
    id: '3',
    bankId: 'LDB',
    bankName: getBankName('LDB'),
    currencyPair: 'USD/LAK',
    buyPrice: 21860,
    sellPrice: 22040,
    spread: 180,
    percentChange24h: -0.08,
    timestamp: Date.now(),
  },
  {
    id: '4',
    bankId: 'APB',
    bankName: getBankName('APB'),
    currencyPair: 'USD/LAK',
    buyPrice: 21870,
    sellPrice: 22030,
    spread: 160,
    percentChange24h: 0.10,
    timestamp: Date.now(),
  },
  {
    id: '5',
    bankId: 'JDB',
    bankName: getBankName('JDB'),
    currencyPair: 'USD/LAK',
    buyPrice: 21890,
    sellPrice: 22010,
    spread: 120,
    percentChange24h: 0.18,
    timestamp: Date.now(),
  },
  // THB/LAK
  {
    id: '6',
    bankId: 'BOL',
    bankName: getBankName('BOL'),
    currencyPair: 'THB/LAK',
    buyPrice: 620,
    sellPrice: 640,
    spread: 20,
    percentChange24h: -0.12,
    timestamp: Date.now(),
  },
  {
    id: '7',
    bankId: 'BCEL',
    bankName: getBankName('BCEL'),
    currencyPair: 'THB/LAK',
    buyPrice: 622,
    sellPrice: 638,
    spread: 16,
    percentChange24h: 0.05,
    timestamp: Date.now(),
  },
];

// 生成 7 天的歷史數據
export const mockHistoricalRates: HistoricalRate[] = [];

const now = Date.now();
// 自動從 mockBanks 中提取所有啟用銀行的 bankId，無需手動維護
const banks = mockBanks.filter(bank => bank.isActive).map(bank => bank.bankId);

for (let day = 6; day >= 0; day--) {
  for (let hour = 0; hour < 24; hour += 6) {
    const timestamp = now - (day * 24 * 60 * 60 * 1000) - (hour * 60 * 60 * 1000);
    const date = new Date(timestamp).toISOString().split('T')[0];
    
    banks.forEach((bankId, index) => {
      // 基礎價格加上一些隨機波動
      const basePrice = 21900 + (Math.random() - 0.5) * 100;
      const spread = 120 + Math.random() * 80;
      
      mockHistoricalRates.push({
        id: `hist-${day}-${hour}-${index}`,
        bankId,
        currencyPair: 'USD/LAK',
        buyPrice: Math.round(basePrice),
        sellPrice: Math.round(basePrice + spread),
        date,
        hour,
        timestamp,
      });
    });
  }
}
