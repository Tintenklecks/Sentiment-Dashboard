import ReactECharts from 'echarts-for-react';
import type { SentimentRecord } from '../../types';

interface Props {
  data: SentimentRecord[];
}

export const MentionScatter = ({ data }: Props) => {
  // Aggregate data by symbol
  const coinStats = data.reduce((acc, record) => {
    if (!acc[record.symbol]) {
      acc[record.symbol] = {
        symbol: record.symbol,
        name: record.coin_name,
        sentiments: [],
      };
    }
    acc[record.symbol].sentiments.push(record.sentiment);
    return acc;
  }, {} as Record<string, { symbol: string; name: string; sentiments: number[] }>);
  
  // Calculate statistics
  const scatterData = Object.values(coinStats).map(coin => {
    const avg = coin.sentiments.reduce((a, b) => a + b, 0) / coin.sentiments.length;
    const mentions = coin.sentiments.length;
    const std = Math.sqrt(
      coin.sentiments.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / coin.sentiments.length
    );
    
    return {
      value: [mentions, avg],
      symbol: coin.symbol,
      name: coin.name,
      std,
      itemStyle: {
        color: avg > 0.1 ? '#22c55e' : avg < -0.1 ? '#ef4444' : '#6b7280',
      },
    };
  });
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
      },
      formatter: (params: any) => {
        const data = scatterData[params.dataIndex];
        return `<strong>${data.symbol}</strong> - ${data.name}<br/>
                Mentions: ${params.value[0]}<br/>
                Avg Sentiment: ${params.value[1] >= 0 ? '+' : ''}${params.value[1].toFixed(3)}<br/>
                Std Dev: ${data.std.toFixed(3)}`;
      },
    },
    grid: {
      left: '80px',
      right: '40px',
      top: '60px',
      bottom: '60px',
    },
    xAxis: {
      type: 'value',
      name: 'Number of Mentions',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: '#9ca3af',
        fontSize: 12,
      },
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
    yAxis: {
      type: 'value',
      name: 'Average Sentiment',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: {
        color: '#9ca3af',
        fontSize: 12,
      },
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
    visualMap: {
      min: -1,
      max: 1,
      dimension: 1,
      orient: 'vertical',
      right: 10,
      top: 'center',
      text: ['HIGH', 'LOW'],
      calculable: true,
      inRange: {
        color: ['#ef4444', '#fbbf24', '#84cc16', '#22c55e'],
      },
      textStyle: {
        color: '#9ca3af',
      },
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        symbolSize: (data: any) => Math.sqrt(data[0]) * 5, // Size based on mentions
        label: {
          show: true,
          formatter: (params: any) => scatterData[params.dataIndex].symbol,
          position: 'top',
          color: '#fff',
          fontSize: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
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
        Mentions vs Sentiment
        <span className="text-sm font-normal text-gray-400 ml-2">
          (Bubble size = mention count)
        </span>
      </h3>
      <ReactECharts 
        option={option} 
        style={{ height: '500px' }}
        theme="dark"
      />
    </div>
  );
};

