# Dashboard Setup Guide

Quick setup instructions for the Crypto Sentiment Dashboard.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd Dashboard
npm install
```

This will install all required packages including:
- React & React DOM
- ECharts for charting
- TanStack Query for data fetching
- Tailwind CSS for styling
- TypeScript and build tools

### 2. Configure Environment (Optional)

The dashboard works with mock data by default. To connect to your real API:

1. Copy the environment example:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your API URL:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

3. Update `src/hooks/useSentimentData.ts` to use the real API (see comments in file)

### 3. Start Development Server

```bash
npm run dev
```

The dashboard will be available at: `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### 5. Preview Production Build

```bash
npm run preview
```

## Quick Test

After starting the dev server, you should see:
- ✅ Dashboard with mock sentiment data
- ✅ Trading signals for various coins
- ✅ Interactive charts (heatmap, trends, distribution, scatter)
- ✅ Responsive design that works on all screen sizes

## Common Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## Embedding Options

### Option 1: Standalone
Host the built dashboard on any web server:
```bash
npm run build
# Upload dist/ folder to your server
```

### Option 2: iframe
Embed in an existing page:
```html
<iframe src="http://your-dashboard-url" width="100%" height="800px"></iframe>
```

### Option 3: Component
Import directly in a React app:
```javascript
import { Dashboard } from './components/Dashboard';
```

## Troubleshooting

**Port 3000 already in use?**
```bash
# Edit vite.config.ts and change the port:
server: {
  port: 3001, // or any other port
}
```

**Charts not rendering?**
- Check browser console for errors
- Ensure all dependencies are installed
- Try clearing cache: `rm -rf node_modules/.vite`

**Build fails?**
- Ensure you're using Node.js 18+
- Clear and reinstall: `rm -rf node_modules && npm install`

## Next Steps

1. **Connect to Real API**: Update the data fetching hook to use your backend
2. **Customize Styling**: Edit Tailwind config and component styles
3. **Add Features**: The component structure makes it easy to add new charts
4. **Deploy**: Build and deploy to any static hosting (Vercel, Netlify, etc.)

## Architecture

```
User Browser
     ↓
  Dashboard Component (React)
     ↓
  TanStack Query (Data Management)
     ↓
  API Service Layer
     ↓
  Backend API (Python/FastAPI)
     ↓
  MariaDB Database
```

The dashboard is designed to be:
- **Modular**: Each chart is a separate component
- **Type-Safe**: Full TypeScript coverage
- **Performant**: Optimized rendering and data caching
- **Responsive**: Works on all devices
- **Embeddable**: Can be integrated anywhere

Enjoy your new dashboard! 🚀

