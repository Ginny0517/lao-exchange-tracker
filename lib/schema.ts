// InstantDB Schema 定義
export const schema = {
  currentRates: {
    fields: {
      bankId: { type: "string", indexed: true },
      bankName: { type: "string" },
      currencyPair: { type: "string", indexed: true },
      buyPrice: { type: "number" },
      sellPrice: { type: "number" },
      spread: { type: "number" },
      percentChange24h: { type: "number" },
      timestamp: { type: "number", indexed: true },
    },
  },
  historicalRates: {
    fields: {
      bankId: { type: "string", indexed: true },
      currencyPair: { type: "string", indexed: true },
      buyPrice: { type: "number" },
      sellPrice: { type: "number" },
      date: { type: "string", indexed: true },
      hour: { type: "number" },
      timestamp: { type: "number", indexed: true },
    },
  },
  banks: {
    fields: {
      bankId: { type: "string", indexed: true },
      name: { type: "string" },
      fullName: { type: "string" },
      website: { type: "string" },
      logoUrl: { type: "string" },
      isActive: { type: "boolean" },
      priority: { type: "number" },
    },
  },
  supportedPairs: {
    fields: {
      pair: { type: "string", indexed: true },
      fromCurrency: { type: "string" },
      toCurrency: { type: "string" },
      displayName: { type: "string" },
      isActive: { type: "boolean" },
    },
  },
};

export type Schema = typeof schema;
