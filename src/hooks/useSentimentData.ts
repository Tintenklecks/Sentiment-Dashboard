import { useQuery } from '@tanstack/react-query';
import { fetchSentimentData, type FetchSentimentParams } from '../services/api';

// List of common stablecoins to filter out
const STABLECOINS = [
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD', 'FRAX', 'USDP',
  'GUSD', 'PYUSD', 'LUSD', 'SUSD', 'USTC', 'UST', 'FDUSD', 'EURT'
];

export const useSentimentData = (params: FetchSentimentParams = {}) => {
  return useQuery({
    queryKey: ['sentiment', params],
    queryFn: async () => {
      const data = await fetchSentimentData(params);
      
      // Filter out stablecoins from records
      const filteredRecords = data.records.filter(
        record => !STABLECOINS.includes(record.symbol.toUpperCase())
      );
      
      // Filter out stablecoins from signals
      const filteredSignals = Object.fromEntries(
        Object.entries(data.signals).filter(
          ([symbol]) => !STABLECOINS.includes(symbol.toUpperCase())
        )
      );
      
      // Recalculate unique coins after filtering
      const uniqueCoins = new Set(filteredRecords.map(r => r.symbol)).size;
      
      return {
        ...data,
        records: filteredRecords,
        signals: filteredSignals,
        total_records: filteredRecords.length,
        unique_coins: uniqueCoins,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Mock data generator - Commented out, now using real API
/* function generateMockData(days: number = 7, hours?: number) {
  // If hours is provided, scale down the data generation
  if (hours !== undefined) {
    days = hours / 24;
  }
  const coins = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'DOT', name: 'Polkadot' },
    { symbol: 'AVAX', name: 'Avalanche' },
    { symbol: 'MATIC', name: 'Polygon' },
    { symbol: 'LINK', name: 'Chainlink' },
    { symbol: 'UNI', name: 'Uniswap' },
    { symbol: 'ATOM', name: 'Cosmos' },
  ];
  
  const records: SentimentRecord[] = [];
  const now = new Date();
  
  for (let i = 0; i < days * 24; i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    coins.forEach((coin, idx) => {
      // Generate more records for popular coins
      const recordCount = idx < 3 ? 3 : idx < 6 ? 2 : 1;
      
      for (let j = 0; j < recordCount; j++) {
        const baselineSentiment = (idx - 5) * 0.1; // Some coins trend positive, some negative
        const randomVariation = (Math.random() - 0.5) * 0.4;
        const timeDecay = i * 0.001;
        
        records.push({
          symbol: coin.symbol,
          coin_name: coin.name,
          sentiment: Math.max(-1, Math.min(1, baselineSentiment + randomVariation - timeDecay)),
          date: date.toISOString(),
          explanation: `Sentiment analysis for ${coin.name}`,
          article_title: `News about ${coin.name} - Article ${j + 1}`,
          source: ['CoinDesk', 'CryptoNews', 'Decrypt', 'TheBlock'][Math.floor(Math.random() * 4)],
          relevance: Math.random() * 0.5 + 0.5,
        });
      }
    });
  }
  
  const signals = calculateTradingSignals(records);
  
  return {
    records,
    signals,
    total_records: records.length,
    unique_coins: coins.length,
  };
} */

