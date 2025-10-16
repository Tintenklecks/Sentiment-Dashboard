import { useQuery } from '@tanstack/react-query';
import { calculateTradingSignals, type FetchSentimentParams } from '../services/api';
import type { SentimentRecord } from '../types';

export const useSentimentData = (params: FetchSentimentParams = {}) => {
  return useQuery({
    queryKey: ['sentiment', params],
    queryFn: async () => {
      // For now, return mock data until API is ready
      // Replace this with actual API call when backend endpoint is available
      return generateMockData(params.days, params.hours);
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Mock data generator - Remove this when API is ready
function generateMockData(days: number = 7, hours?: number) {
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
}

