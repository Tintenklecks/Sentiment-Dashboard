import axios from 'axios';
import type { SentimentRecord, TradingSignal } from '../types';

const api = axios.create({
  baseURL: '/v1',
  timeout: 30000,
});

export interface FetchSentimentParams {
  days?: number;
  hours?: number;
  symbols?: string[];
}

export interface SentimentResponse {
  records: SentimentRecord[];
  signals: Record<string, TradingSignal>;
  total_records: number;
  unique_coins: number;
}

/**
 * Fetch sentiment data from the API
 * If hours is set, it takes priority over days
 */
export const fetchSentimentData = async (params: FetchSentimentParams = {}): Promise<SentimentResponse> => {
  const { days, hours, symbols } = params;
  
  const queryParams = new URLSearchParams();
  
  // Hours takes priority over days
  if (hours !== undefined) {
    queryParams.append('hours', hours.toString());
  } else if (days !== undefined) {
    queryParams.append('days', days.toString());
  } else {
    queryParams.append('days', '7'); // default
  }
  
  if (symbols && symbols.length > 0) {
    queryParams.append('symbols', symbols.join(','));
  }
  
  const response = await api.get(`/dashboard/sentiment?${queryParams.toString()}`);
  return response.data;
};

/**
 * Calculate trading signals from sentiment records
 * This mirrors the Python logic from sentiment_dashboard.py
 */
export const calculateTradingSignals = (records: SentimentRecord[]): Record<string, TradingSignal> => {
  const signals: Record<string, TradingSignal> = {};
  
  // Group by symbol
  const bySymbol = records.reduce((acc, record) => {
    if (!acc[record.symbol]) {
      acc[record.symbol] = [];
    }
    acc[record.symbol].push(record);
    return acc;
  }, {} as Record<string, SentimentRecord[]>);
  
  // Calculate signals for each symbol
  Object.entries(bySymbol).forEach(([symbol, data]) => {
    const sortedData = data.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const avgSentiment = data.reduce((sum, r) => sum + r.sentiment, 0) / data.length;
    const recentData = sortedData.slice(0, Math.min(5, data.length));
    const recentSentiment = recentData.reduce((sum, r) => sum + r.sentiment, 0) / recentData.length;
    const sentimentTrend = recentSentiment - avgSentiment;
    const mentionCount = data.length;
    
    let signal: TradingSignal['signal'] = 'NEUTRAL';
    let strength = 0.0;
    
    if (recentSentiment > 0.3 && sentimentTrend > 0.1) {
      signal = 'STRONG BUY';
      strength = Math.min(1.0, recentSentiment + sentimentTrend);
    } else if (recentSentiment > 0.1) {
      signal = 'BUY';
      strength = recentSentiment;
    } else if (recentSentiment < -0.3 && sentimentTrend < -0.1) {
      signal = 'STRONG SELL';
      strength = Math.abs(Math.min(-1.0, recentSentiment + sentimentTrend));
    } else if (recentSentiment < -0.1) {
      signal = 'SELL';
      strength = Math.abs(recentSentiment);
    }
    
    signals[symbol] = {
      symbol,
      signal,
      strength,
      avg_sentiment: avgSentiment,
      recent_sentiment: recentSentiment,
      trend: sentimentTrend,
      mentions: mentionCount,
      coin_name: data[0].coin_name,
    };
  });
  
  return signals;
};

export default api;

