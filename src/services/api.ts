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
// Transform API response to our format
const transformApiResponse = (apiData: any): SentimentResponse => {
  console.log('Raw API Response:', JSON.stringify(apiData, null, 2)); // Detailed debug log
  
  const records: SentimentRecord[] = [];
  
  // Check if we have the expected structure
  if (apiData.data && apiData.data.sentiments) {
    console.log('Using new API format (data.sentiments)');
    // New API format
    apiData.data.sentiments.forEach((sentiment: any, index: number) => {
      console.log(`Processing sentiment ${index}:`, {
        symbol: sentiment.symbol,
        article_url: sentiment.article_url,
        article_summary: sentiment.article_summary
      });
      
      const record: SentimentRecord = {
        symbol: sentiment.symbol,
        coin_name: sentiment.coinName,
        sentiment: sentiment.sentiment,
        date: sentiment.date,
        explanation: sentiment.explanation,
        article_title: sentiment.article?.title || 'Unknown Title',
        source: sentiment.article?.source || 'Unknown Source',
        relevance: sentiment.relevance,
        url: sentiment.article?.link,
        article: sentiment.article
      };
      
      console.log(`Created record ${index}:`, {
        url: record.url,
        article_title: record.article_title,
        source: record.source
      });
      
      records.push(record);
    });
  } else if (apiData.sentiments) {
    console.log('Using direct sentiments format');
    // Direct sentiments array
    apiData.sentiments.forEach((sentiment: any, index: number) => {
      console.log(`Processing sentiment ${index}:`, {
        symbol: sentiment.symbol,
        article_url: sentiment.article_url,
        article_summary: sentiment.article_summary
      });
      
      const record: SentimentRecord = {
        symbol: sentiment.symbol,
        coin_name: sentiment.coinName,
        sentiment: sentiment.sentiment,
        date: sentiment.date,
        explanation: sentiment.explanation,
        article_title: sentiment.article?.title || 'Unknown Title',
        source: sentiment.article?.source || 'Unknown Source',
        relevance: sentiment.relevance,
        url: sentiment.article?.link,
        article: sentiment.article
      };
      
      console.log(`Created record ${index}:`, {
        url: record.url,
        article_title: record.article_title,
        source: record.source
      });
      
      records.push(record);
    });
  } else if (apiData.records) {
    console.log('Using updated dashboard format with article_url and article_summary');
    // Updated dashboard format with article_url and article_summary
    apiData.records.forEach((record: any, index: number) => {
      console.log(`Processing record ${index}:`, {
        symbol: record.symbol,
        article_url: record.article_url,
        article_summary: record.article_summary
      });
      
      // Create summary from first sentence + "..."
      let summary = '';
      if (record.article_summary) {
        const firstSentence = record.article_summary.split('.')[0];
        summary = firstSentence + '...';
      }
      
      const transformedRecord: SentimentRecord = {
        symbol: record.symbol,
        coin_name: record.coin_name,
        sentiment: record.sentiment,
        date: record.date,
        explanation: record.explanation,
        article_title: record.article_title,
        source: record.source,
        relevance: record.relevance,
        url: record.article_url,
        summary: summary
      };
      
      console.log(`Created transformed record ${index}:`, {
        url: transformedRecord.url,
        summary: transformedRecord.summary,
        article_title: transformedRecord.article_title
      });
      
      records.push(transformedRecord);
    });
  } else {
    console.error('Unexpected API response format:', apiData);
    // Return empty response to prevent crash
    return {
      records: [],
      signals: {},
      total_records: 0,
      unique_coins: 0
    };
  }
  
  console.log('Final records with URLs:', records.map(r => ({ 
    title: r.article_title, 
    url: r.url, 
    summary: r.summary
  })));
  
  // Calculate signals
  const calculatedSignals = calculateTradingSignals(records);
  
  return {
    records,
    signals: calculatedSignals,
    total_records: records.length,
    unique_coins: new Set(records.map(r => r.symbol)).size
  };
};

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
  return transformApiResponse(response.data);
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

