# Crypto Sentiment Dashboard

A beautiful, modern React dashboard for visualizing cryptocurrency sentiment analysis data. Built with React, TypeScript, ECharts, and Tailwind CSS.

## ✨ Features

- **Real-time Trading Signals**: Get buy/sell signals based on sentiment analysis
- **Interactive Charts**: 
  - Sentiment heatmap showing trends across coins and time
  - Time series sentiment trends
  - Sentiment distribution with box plots
  - Mentions vs sentiment scatter plot
- **Beautiful UI**: Modern glassmorphism design with smooth animations
- **Responsive**: Works on desktop, tablet, and mobile
- **Fast**: Built with Vite for instant hot module replacement
- **Type-Safe**: Written in TypeScript for better developer experience
- **Embeddable**: Can be embedded into existing web applications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (see parent directory for API setup)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dashboard will be available at `http://localhost:3000`

## 🔧 Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to configure:

- `VITE_API_URL`: Your API endpoint URL
- `VITE_DEFAULT_DAYS`: Default time range for data (in days)
- `VITE_REFRESH_INTERVAL`: Auto-refresh interval in milliseconds

## 📊 Components

### Main Dashboard (`/src/components/Dashboard.tsx`)
The main dashboard component that orchestrates all sub-components and manages state.

### Trading Signals (`/src/components/TradingSignals.tsx`)
Displays buy/sell/neutral signals with:
- Signal strength indicators
- Sentiment trends
- Mention counts
- Color-coded categories

### Charts

#### Sentiment Heatmap (`/src/components/charts/SentimentHeatmap.tsx`)
Shows sentiment across coins and time in a color-coded grid.

#### Sentiment Trends (`/src/components/charts/SentimentTrends.tsx`)
Line chart showing how sentiment changes over time for top coins.

#### Sentiment Distribution (`/src/components/charts/SentimentDistribution.tsx`)
Box plots showing sentiment distribution for each coin.

#### Mention Scatter (`/src/components/charts/MentionScatter.tsx`)
Scatter plot correlating mention count with average sentiment.

## 🎨 Customization

### Themes

The dashboard uses Tailwind CSS for styling. Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Chart Styling

ECharts options can be customized in each chart component. All charts support:
- Custom color schemes
- Responsive sizing
- Interactive tooltips
- Animation configurations

## 🔌 API Integration

The dashboard expects the following API endpoint:

```
GET /api/sentiment?days=7&symbols=BTC,ETH
```

Response format:
```json
{
  "records": [
    {
      "symbol": "BTC",
      "coin_name": "Bitcoin",
      "sentiment": 0.75,
      "date": "2025-10-15T12:00:00",
      "explanation": "Positive news...",
      "article_title": "Bitcoin surges...",
      "source": "CoinDesk",
      "relevance": 0.9
    }
  ],
  "signals": {
    "BTC": {
      "signal": "STRONG BUY",
      "strength": 0.85,
      "avg_sentiment": 0.65,
      "recent_sentiment": 0.75,
      "trend": 0.1,
      "mentions": 42,
      "coin_name": "Bitcoin"
    }
  },
  "total_records": 1250,
  "unique_coins": 50
}
```

### Mock Data

The dashboard currently uses mock data for development. To connect to your real API:

1. Update `/src/hooks/useSentimentData.ts`
2. Replace the mock data generator with the actual API call:

```typescript
export const useSentimentData = (params: FetchSentimentParams = {}) => {
  return useQuery({
    queryKey: ['sentiment', params],
    queryFn: () => fetchSentimentData(params), // Use real API
    refetchInterval: 60000,
  });
};
```

## 🌐 Embedding

To embed this dashboard into an existing webpage:

### Method 1: As a Full Page
```html
<iframe src="http://localhost:3000" width="100%" height="800px"></iframe>
```

### Method 2: As a React Component
```javascript
import { Dashboard } from './components/Dashboard';

function MyApp() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
```

### Method 3: Build and Host Separately
```bash
npm run build
# Upload dist/ folder to your web server
```

## 📦 Project Structure

```
Dashboard/
├── src/
│   ├── components/
│   │   ├── charts/           # Chart components
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── TradingSignals.tsx
│   │   └── StatsCard.tsx
│   ├── hooks/
│   │   └── useSentimentData.ts
│   ├── services/
│   │   └── api.ts            # API client
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **ECharts**: Charting library
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date manipulation
- **Axios**: HTTP client

## 📝 Development Tips

### Hot Module Replacement
Vite provides instant HMR - changes appear immediately without page reload.

### Type Checking
```bash
npm run lint
```

### Production Build
```bash
npm run build
# Output in dist/
```

### Preview Production Build
```bash
npm run preview
```

## 🐛 Troubleshooting

### Charts Not Rendering
- Ensure ECharts is properly installed: `npm install echarts echarts-for-react`
- Check browser console for errors

### API Connection Issues
- Verify API URL in `.env`
- Check CORS settings on backend
- Ensure backend is running

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📄 License

Part of the SentimentDB project.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue in the main repository.

---

Built with ❤️ using React + ECharts

