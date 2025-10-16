import ReactECharts from 'echarts-for-react';
import type { SentimentRecord } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: SentimentRecord[];
  topN?: number;
}

export const SentimentHeatmap = ({ data, topN = 20 }: Props) => {
  // Get top coins by mention count
  const coinCounts = data.reduce((acc, record) => {
    acc[record.symbol] = (acc[record.symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCoins = Object.entries(coinCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([symbol]) => symbol);
  
  // Filter data for top coins
  const filteredData = data.filter(r => topCoins.includes(r.symbol));
  
  // Group by date and symbol
  const heatmapData: Record<string, Record<string, number[]>> = {};
  
  filteredData.forEach(record => {
    const date = format(parseISO(record.date), 'yyyy-MM-dd');
    if (!heatmapData[date]) {
      heatmapData[date] = {};
    }
    if (!heatmapData[date][record.symbol]) {
      heatmapData[date][record.symbol] = [];
    }
    heatmapData[date][record.symbol].push(record.sentiment);
  });
  
  // Create sorted dates and symbols
  const dates = Object.keys(heatmapData).sort();
  const symbols = topCoins;
  
  // Create data points for ECharts
  const chartData: [number, number, number][] = [];
  
  dates.forEach((date, dateIdx) => {
    symbols.forEach((symbol, symbolIdx) => {
      const sentiments = heatmapData[date][symbol] || [];
      if (sentiments.length > 0) {
        const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
        chartData.push([dateIdx, symbolIdx, Number(avgSentiment.toFixed(2))]);
      }
    });
  });
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const date = dates[params.data[0]];
        const symbol = symbols[params.data[1]];
        const sentiment = params.data[2];
        return `<strong>${symbol}</strong><br/>
                ${date}<br/>
                Sentiment: <strong>${sentiment >= 0 ? '+' : ''}${sentiment}</strong>`;
      },
    },
    grid: {
      left: '80px',
      right: '20px',
      top: '60px',
      bottom: '60px',
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitArea: {
        show: true,
      },
      axisLabel: {
        rotate: 45,
        color: '#9ca3af',
      },
    },
    yAxis: {
      type: 'category',
      data: symbols,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: '#9ca3af',
      },
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0',
      inRange: {
        color: ['#ef4444', '#fbbf24', '#84cc16', '#22c55e', '#10b981'],
      },
      textStyle: {
        color: '#9ca3af',
      },
    },
    series: [
      {
        name: 'Sentiment',
        type: 'heatmap',
        data: chartData,
        label: {
          show: true,
          formatter: (params: any) => params.data[2],
          color: '#fff',
          fontSize: 10,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
  
  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Sentiment Heatmap - Top {topN} Coins
      </h3>
      <ReactECharts 
        option={option} 
        style={{ height: '500px' }}
        theme="dark"
      />
    </div>
  );
};

