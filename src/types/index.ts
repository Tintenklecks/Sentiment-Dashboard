export interface SentimentRecord {
  symbol: string;
  coin_name: string;
  sentiment: number;
  date: string;
  explanation: string;
  article_title: string;
  source: string;
  relevance: number;
}

export interface TradingSignal {
  symbol: string;
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  strength: number;
  avg_sentiment: number;
  recent_sentiment: number;
  trend: number;
  mentions: number;
  coin_name: string;
}

export interface SentimentData {
  records: SentimentRecord[];
  signals: Record<string, TradingSignal>;
  total_records: number;
  unique_coins: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface HeatmapDataPoint {
  symbol: string;
  date: string;
  sentiment: number;
}

export interface TrendDataPoint {
  timestamp: string;
  sentiment: number;
}

export interface ScatterDataPoint {
  symbol: string;
  coin_name: string;
  mentions: number;
  avg_sentiment: number;
  sentiment_std: number;
}

