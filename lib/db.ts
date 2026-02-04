import { init } from "@instantdb/react";
import { Schema } from "./schema";
import type { CurrentRate, HistoricalRate, Bank, SupportedPair } from "./types";

// 替換為您的 InstantDB App ID
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "YOUR_APP_ID_HERE";

export const db = init<Schema>({ appId: APP_ID });

// 查詢 hooks（明確回傳 CurrentRate[] 以符合元件型別）
export const useCurrentRates = (): {
  isLoading: boolean;
  error: Error | null;
  currentRates: CurrentRate[];
} => {
  const { isLoading, error, data } = db.useQuery({
    currentRates: {},
  });

  const rows = data?.currentRates ?? [];
  const currentRates = Array.isArray(rows) ? (rows as unknown as CurrentRate[]) : [];

  return {
    isLoading,
    error: error ?? null,
    currentRates,
  };
};

export const useHistoricalRates = (
  bankId?: string,
  currencyPair?: string
): {
  isLoading: boolean;
  error: Error | null;
  historicalRates: HistoricalRate[];
} => {
  const query = bankId && currencyPair
    ? {
        historicalRates: {
          $: {
            where: {
              and: [
                { bankId },
                { currencyPair },
              ],
            },
          },
        },
      }
    : { historicalRates: {} };

  const { isLoading, error, data } = db.useQuery(query);

  const rows = data?.historicalRates ?? [];
  const historicalRates = Array.isArray(rows) ? (rows as unknown as HistoricalRate[]) : [];

  return {
    isLoading,
    error: error ?? null,
    historicalRates,
  };
};

export const useBanks = (): {
  isLoading: boolean;
  error: Error | null;
  banks: Bank[];
} => {
  const { isLoading, error, data } = db.useQuery({
    banks: {
      $: {
        where: { isActive: true },
      },
    },
  });

  const rows = data?.banks ?? [];
  const banks = Array.isArray(rows) ? (rows as unknown as Bank[]) : [];

  return {
    isLoading,
    error: error ?? null,
    banks,
  };
};

export const useSupportedPairs = (): {
  isLoading: boolean;
  error: Error | null;
  pairs: SupportedPair[];
} => {
  const { isLoading, error, data } = db.useQuery({
    supportedPairs: {
      $: {
        where: { isActive: true },
      },
    },
  });

  const rows = data?.supportedPairs ?? [];
  const pairs = Array.isArray(rows) ? (rows as unknown as SupportedPair[]) : [];

  return {
    isLoading,
    error: error ?? null,
    pairs,
  };
};
