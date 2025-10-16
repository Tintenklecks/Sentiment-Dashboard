import { useSentimentData } from '../hooks/useSentimentData';
import { TradingSignals } from './TradingSignals';
import { StatsCard } from './StatsCard';
import { SentimentHeatmap } from './charts/SentimentHeatmap';
import { SentimentTrends } from './charts/SentimentTrends';
import { SentimentDistribution } from './charts/SentimentDistribution';
import { MentionScatter } from './charts/MentionScatter';
import { Activity, TrendingUp, Coins, BarChart3, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sentiment-dashboard-timerange';

export const Dashboard = () => {
  // Load initial state from localStorage or use default
  const [timeRange, setTimeRange] = useState<{ type: 'days' | 'hours', value: number }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { type: 'days', value: 7 };
      }
    }
    return { type: 'days', value: 7 };
  });
  
  // Save to localStorage whenever timeRange changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeRange));
  }, [timeRange]);
  
  const params = timeRange.type === 'hours' 
    ? { hours: timeRange.value }
    : { days: timeRange.value };
    
  const { data, isLoading, error, refetch, isFetching } = useSentimentData(params);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading sentiment data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-panel p-8 max-w-md">
          <p className="text-red-400 text-lg font-semibold mb-2">Error Loading Data</p>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return null;
  }
  
  const avgSentiment = data.records.length > 0
    ? data.records.reduce((sum, r) => sum + r.sentiment, 0) / data.records.length
    : 0;
  
  const recentRecords = data.records.slice(0, Math.floor(data.records.length / 2));
  const recentAvg = recentRecords.length > 0
    ? recentRecords.reduce((sum, r) => sum + r.sentiment, 0) / recentRecords.length
    : 0;
  
  const sentimentTrend = ((recentAvg - avgSentiment) / Math.abs(avgSentiment || 1)) * 100;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Crypto Sentiment Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time trading insights powered by sentiment analysis
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={`${timeRange.type}:${timeRange.value}`}
                onChange={(e) => {
                  const [type, value] = e.target.value.split(':');
                  setTimeRange({ 
                    type: type as 'days' | 'hours', 
                    value: Number(value) 
                  });
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Hours">
                  <option value="hours:1">Last hour</option>
                  <option value="hours:3">Last 3 hours</option>
                  <option value="hours:6">Last 6 hours</option>
                  <option value="hours:12">Last 12 hours</option>
                  <option value="hours:24">Last 24 hours</option>
                </optgroup>
                <optgroup label="Days">
                  <option value="days:3">Last 3 days</option>
                  <option value="days:7">Last 7 days</option>
                  <option value="days:14">Last 14 days</option>
                  <option value="days:30">Last 30 days</option>
                  <option value="days:90">Last 90 days</option>
                </optgroup>
              </select>
              
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-6 h-6 text-blue-400 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Records"
            value={data.total_records.toLocaleString()}
            icon={Activity}
            subtitle={timeRange.type === 'hours' 
              ? `Last ${timeRange.value} ${timeRange.value === 1 ? 'hour' : 'hours'}`
              : `Last ${timeRange.value} ${timeRange.value === 1 ? 'day' : 'days'}`
            }
          />
          <StatsCard
            title="Unique Coins"
            value={data.unique_coins}
            icon={Coins}
            subtitle="Being tracked"
          />
          <StatsCard
            title="Avg Sentiment"
            value={avgSentiment >= 0 ? `+${avgSentiment.toFixed(2)}` : avgSentiment.toFixed(2)}
            icon={TrendingUp}
            trend={{
              value: Math.abs(sentimentTrend),
              isPositive: sentimentTrend > 0,
            }}
          />
          <StatsCard
            title="Active Signals"
            value={Object.values(data.signals).filter(s => s.signal !== 'NEUTRAL').length}
            icon={BarChart3}
            subtitle={`${Object.keys(data.signals).length} total`}
          />
        </div>
        
        {/* Trading Signals */}
        <div className="mb-8">
          <TradingSignals signals={data.signals} records={data.records} timeRange={timeRange} />
        </div>
        
        {/* Charts Grid */}
        <div className="space-y-8">
          <SentimentTrends data={data.records} topN={10} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SentimentDistribution data={data.records} topN={15} />
            <MentionScatter data={data.records} />
          </div>
          
          <SentimentHeatmap data={data.records} topN={20} />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Crypto Sentiment Analysis Dashboard • Data updates every minute
          </p>
        </div>
      </footer>
    </div>
  );
};

