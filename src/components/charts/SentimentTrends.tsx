import ReactECharts from 'echarts-for-react';
import type { SentimentRecord } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: SentimentRecord[];
  symbols?: string[];
  topN?: number;
}

export const SentimentTrends = ({ data, symbols, topN = 10 }: Props) => {
  // Determine which symbols to show
  let displaySymbols = symbols;
  if (!displaySymbols || displaySymbols.length === 0) {
    const coinCounts = data.reduce((acc, record) => {
      acc[record.symbol] = (acc[record.symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    displaySymbols = Object.entries(coinCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([symbol]) => symbol);
  }
  
  // Filter and group data by symbol and hour
  const filteredData = data.filter(r => displaySymbols!.includes(r.symbol));
  
  const seriesData: Record<string, Record<string, number[]>> = {};
  
  filteredData.forEach(record => {
    const timestamp = format(parseISO(record.date), "yyyy-MM-dd HH:00");
    if (!seriesData[record.symbol]) {
      seriesData[record.symbol] = {};
    }
    if (!seriesData[record.symbol][timestamp]) {
      seriesData[record.symbol][timestamp] = [];
    }
    seriesData[record.symbol][timestamp].push(record.sentiment);
  });
  
  // Get all unique timestamps and sort
  const allTimestamps = new Set<string>();
  Object.values(seriesData).forEach(symbolData => {
    Object.keys(symbolData).forEach(ts => allTimestamps.add(ts));
  });
  const timestamps = Array.from(allTimestamps).sort();
  
  // Color palette
  const colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#10b981', '#f97316', '#6366f1'
  ];
  
  // Create series for each symbol
  const series = displaySymbols!.map((symbol, idx) => {
    const symbolData = seriesData[symbol] || {};
    const values = timestamps.map(ts => {
      const sentiments = symbolData[ts] || [];
      if (sentiments.length === 0) return null;
      return (sentiments.reduce((a, b) => a + b, 0) / sentiments.length).toFixed(3);
    });
    
    return {
      name: symbol,
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbolSize: 6,
      data: values,
      itemStyle: {
        color: colors[idx % colors.length],
      },
      lineStyle: {
        width: 2,
      },
    };
  });
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
      },
    },
    legend: {
      data: displaySymbols,
      textStyle: {
        color: '#9ca3af',
      },
      type: 'scroll',
      top: 0,
    },
    grid: {
      left: '60px',
      right: '40px',
      top: '60px',
      bottom: '60px',
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLabel: {
        rotate: 45,
        color: '#9ca3af',
        formatter: (value: string) => {
          // Show only date and hour
          const parts = value.split(' ');
          return `${parts[0].slice(5)}\n${parts[1]}`;
        },
      },
      axisLine: {
        lineStyle: {
          color: '#374151',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Sentiment',
      axisLabel: {
        color: '#9ca3af',
      },
      axisLine: {
        lineStyle: {
          color: '#374151',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    },
    series,
  };
  
  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Sentiment Trends Over Time
      </h3>
      <ReactECharts 
        option={option} 
        style={{ height: '400px' }}
        theme="dark"
      />
    </div>
  );
};

