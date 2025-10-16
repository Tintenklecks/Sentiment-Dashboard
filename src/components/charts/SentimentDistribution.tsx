import ReactECharts from 'echarts-for-react';
import type { SentimentRecord } from '../../types';

interface Props {
  data: SentimentRecord[];
  topN?: number;
}

export const SentimentDistribution = ({ data, topN = 15 }: Props) => {
  // Get top coins by average sentiment
  const coinData = data.reduce((acc, record) => {
    if (!acc[record.symbol]) {
      acc[record.symbol] = {
        sentiments: [],
        name: record.coin_name,
      };
    }
    acc[record.symbol].sentiments.push(record.sentiment);
    return acc;
  }, {} as Record<string, { sentiments: number[]; name: string }>);
  
  // Calculate average and sort
  const sortedCoins = Object.entries(coinData)
    .map(([symbol, { sentiments, name }]) => ({
      symbol,
      name,
      avg: sentiments.reduce((a, b) => a + b, 0) / sentiments.length,
      sentiments,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, topN);
  
  // Prepare box plot data
  const boxData = sortedCoins.map(coin => {
    const sorted = [...coin.sentiments].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const medianIndex = Math.floor(sorted.length * 0.5);
    
    return [
      sorted[0], // min
      sorted[q1Index], // Q1
      sorted[medianIndex], // median
      sorted[q3Index], // Q3
      sorted[sorted.length - 1], // max
    ];
  });
  
  // Prepare scatter data for all points
  const scatterData = sortedCoins.flatMap((coin, idx) =>
    coin.sentiments.map(sentiment => [idx, sentiment])
  );
  
  const option = {
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
      },
    },
    grid: {
      left: '80px',
      right: '40px',
      top: '40px',
      bottom: '80px',
    },
    xAxis: {
      type: 'category',
      data: sortedCoins.map(c => c.symbol),
      axisLabel: {
        rotate: 45,
        color: '#9ca3af',
      },
      axisLine: {
        lineStyle: {
          color: '#374151',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Sentiment Score',
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
    series: [
      {
        name: 'Distribution',
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa',
        },
        tooltip: {
          formatter: (params: any) => {
            const [min, q1, median, q3, max] = params.data;
            return `<strong>${sortedCoins[params.dataIndex].symbol}</strong><br/>
                    Max: ${max.toFixed(2)}<br/>
                    Q3: ${q3.toFixed(2)}<br/>
                    Median: ${median.toFixed(2)}<br/>
                    Q1: ${q1.toFixed(2)}<br/>
                    Min: ${min.toFixed(2)}`;
          },
        },
      },
      {
        name: 'Individual Points',
        type: 'scatter',
        data: scatterData,
        itemStyle: {
          color: 'rgba(59, 130, 246, 0.3)',
        },
        symbolSize: 4,
      },
    ],
  };
  
  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Sentiment Distribution - Top {topN} Coins
      </h3>
      <ReactECharts 
        option={option} 
        style={{ height: '400px' }}
        theme="dark"
      />
    </div>
  );
};

