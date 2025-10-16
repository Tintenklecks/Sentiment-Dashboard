import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import type { TradingSignal } from '../types';

interface Props {
  signals: Record<string, TradingSignal>;
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

export const TradingSignals = ({ signals }: Props) => {
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">{item.symbol}</span>
                      <span className="text-xs text-gray-400">{item.coin_name}</span>
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
  );
};

