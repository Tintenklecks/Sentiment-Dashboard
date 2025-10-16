import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, ArrowRight, LineChart, List, X, ExternalLink } from 'lucide-react';
import type { TradingSignal, SentimentRecord } from '../types';
import { useState } from 'react';

interface Props {
  signals: Record<string, TradingSignal>;
  records: SentimentRecord[];
  timeRange: { type: 'days' | 'hours', value: number };
}

const SignalBadge = ({ signal }: { signal: TradingSignal['signal'] }) => {
  const config = {
    'STRONG BUY': { bg: 'bg-green-500', text: 'Strong Buy', icon: TrendingUp },
    'BUY': { bg: 'bg-green-400', text: 'Buy', icon: TrendingUp },
    'NEUTRAL': { bg: 'bg-gray-500', text: 'Neutral', icon: Minus },
    'SELL': { bg: 'bg-red-400', text: 'Sell', icon: TrendingDown },
    'STRONG SELL': { bg: 'bg-red-500', text: 'Strong Sell', icon: TrendingDown },
  };
  
  const { bg, text, icon: Icon } = config[signal];
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-semibold ${bg}`}>
      <Icon size={14} />
      {text}
    </span>
  );
};

const TrendIndicator = ({ trend }: { trend: number }) => {
  const Icon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : ArrowRight;
  const color = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400';
  
  return (
    <span className={`inline-flex items-center gap-1 ${color} text-sm`}>
      <Icon size={14} />
      {trend >= 0 ? '+' : ''}{trend.toFixed(2)}
    </span>
  );
};

const StrengthBar = ({ strength }: { strength: number }) => {
  const percentage = Math.min(100, strength * 100);
  
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const TradingSignals = ({ signals, records, timeRange }: Props) => {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  
  // Get all records for a specific symbol
  const getCoinRecords = (symbol: string): SentimentRecord[] => {
    return records
      .filter(r => r.symbol === symbol)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  // Get the most recent mention date and sentiment for a symbol
  const getLastMentionInfo = (symbol: string): { dateText: string; sentiment: number } => {
    const symbolRecords = records.filter(r => r.symbol === symbol);
    if (symbolRecords.length === 0) return { dateText: '', sentiment: 0 };
    
    const mostRecent = symbolRecords.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
    
    const date = new Date(mostRecent.date);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let dateText = '';
    // Format relative time
    if (diffMins < 1) dateText = 'Just now';
    else if (diffMins < 60) dateText = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    else if (diffHours < 24) dateText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else if (diffDays < 7) dateText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    else dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return { dateText, sentiment: mostRecent.sentiment };
  };
  
  // Calculate Unix timestamp for TradingView link
  const getUnixTimestamp = () => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const secondsToSubtract = timeRange.type === 'hours' 
      ? timeRange.value * 60 * 60 
      : timeRange.value * 24 * 60 * 60;
    return now - secondsToSubtract;
  };
  
  // Calculate appropriate interval based on timespan
  const getTotalHours = () => {
    return timeRange.type === 'hours' ? timeRange.value : timeRange.value * 24;
  };

  const interval = (() => {
    const totalHours = getTotalHours();
    
    if (totalHours <= 3) return '1';        // 1 minute for up to 3 hours
    if (totalHours <= 6) return '5';        // 5 minutes for up to 6 hours
    if (totalHours <= 12) return '15';      // 15 minutes for up to 12 hours
    if (totalHours <= 24) return '60';      // 1 hour for up to 24 hours
    if (totalHours <= 72) return '240';     // 4 hours for up to 3 days
    if (totalHours <= 168) return 'D';      // Daily for up to 7 days
    return 'W';                              // Weekly for longer periods
  })();
  
  // Generate TradingView URL for a coin
  const getTradingViewUrl = (symbol: string) => {
    const timestamp = getUnixTimestamp();
    const pair = `BINANCE:${symbol}USDT`;
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(pair)}&interval=${interval}&time=${timestamp}`;
  };
  // Group signals by type
  const strongBuys = Object.values(signals).filter(s => s.signal === 'STRONG BUY');
  const buys = Object.values(signals).filter(s => s.signal === 'BUY');
  const sells = Object.values(signals).filter(s => s.signal === 'SELL');
  const strongSells = Object.values(signals).filter(s => s.signal === 'STRONG SELL');
  const neutrals = Object.values(signals).filter(s => s.signal === 'NEUTRAL');
  
  const SignalGroup = ({ 
    title, 
    items, 
    emoji 
  }: { 
    title: string; 
    items: TradingSignal[]; 
    emoji: string;
  }) => {
    if (items.length === 0) return null;
    
    const sortedItems = [...items].sort((a, b) => b.strength - a.strength);
    
    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {title} <span className="text-sm text-gray-400">({items.length} coins)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedItems.map((item) => (
            <div
              key={item.symbol}
              className="glass-panel p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{item.symbol}</span>
                          <span className="text-xs text-gray-400">{item.coin_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <span>Last mentioned {getLastMentionInfo(item.symbol).dateText}</span>
                          {getLastMentionInfo(item.symbol).sentiment > 0 ? (
                            <ArrowUp className="w-3 h-3 text-green-400" />
                          ) : getLastMentionInfo(item.symbol).sentiment < 0 ? (
                            <ArrowDown className="w-3 h-3 text-red-400" />
                          ) : (
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCoin(item.symbol)}
                          className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-colors flex items-center justify-center flex-shrink-0"
                          title="View news mentions"
                        >
                          <List className="w-6 h-6 text-blue-400" />
                        </button>
                        <a
                          href={getTradingViewUrl(item.symbol)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-colors flex items-center justify-center flex-shrink-0"
                          title="View on TradingView"
                        >
                          <LineChart className="w-6 h-6 text-blue-400" />
                        </a>
                      </div>
                    </div>
                    <SignalBadge signal={item.signal} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Score:</span>
                      <span className={`ml-2 font-semibold ${
                        item.recent_sentiment > 0 ? 'text-green-400' : 
                        item.recent_sentiment < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {item.recent_sentiment >= 0 ? '+' : ''}{item.recent_sentiment.toFixed(2)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Trend:</span>
                      <span className="ml-2">
                        <TrendIndicator trend={item.trend} />
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Mentions:</span>
                      <span className="ml-2 font-semibold text-white">{item.mentions}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Avg:</span>
                      <span className={`ml-2 font-semibold ${
                        item.avg_sentiment > 0 ? 'text-green-400' : 
                        item.avg_sentiment < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {item.avg_sentiment >= 0 ? '+' : ''}{item.avg_sentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">Signal Strength</span>
                      <span className="text-xs font-semibold text-white">
                        {(item.strength * 100).toFixed(0)}%
                      </span>
                    </div>
                    <StrengthBar strength={item.strength} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-6 gradient-text">
          📊 Trading Signals
        </h2>
        
        <SignalGroup title="Strong Buy Signals" items={strongBuys} emoji="🟢" />
        <SignalGroup title="Buy Signals" items={buys} emoji="🟩" />
        <SignalGroup title="Strong Sell Signals" items={strongSells} emoji="🔴" />
        <SignalGroup title="Sell Signals" items={sells} emoji="🟥" />
        <SignalGroup title="Neutral" items={neutrals} emoji="⚪" />
        
        {Object.keys(signals).length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No trading signals available
          </div>
        )}
      </div>
      
      {/* News Overlay */}
      {selectedCoin && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCoin(null)}
        >
          <div 
            className="glass-panel max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedCoin} News Mentions
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {getCoinRecords(selectedCoin).length} mention{getCoinRecords(selectedCoin).length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {/* News List */}
            <div className="overflow-y-auto p-6 space-y-4">
              {getCoinRecords(selectedCoin).map((record, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{record.article_title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{new Date(record.date).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        <span>•</span>
                        <span>Relevance: {(record.relevance * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        record.sentiment > 0.3 ? 'bg-green-500/20 text-green-400' :
                        record.sentiment > 0 ? 'bg-green-500/10 text-green-300' :
                        record.sentiment < -0.3 ? 'bg-red-500/20 text-red-400' :
                        record.sentiment < 0 ? 'bg-red-500/10 text-red-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {record.sentiment > 0 ? '+' : ''}{record.sentiment.toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          const url = record.url || record.article?.link || `https://www.google.com/search?q=${encodeURIComponent(record.article_title)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5"
                        title={`Open article on ${record.source}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {record.source}
                      </button>
                    </div>
                  </div>
                  
                  {/* Summary */}
                  {record.summary && (
                    <div className="mb-3">
                      <p className="text-gray-200 text-sm leading-relaxed">{record.summary}</p>
                    </div>
                  )}
                  
                  {/* Horizontal Separator */}
                  <div className="border-t border-white/10 my-3"></div>
                  
                  {/* Explanation */}
                  <div>
                    <p className="text-gray-400 text-xs font-semibold mb-2">Explanation:</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{record.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

