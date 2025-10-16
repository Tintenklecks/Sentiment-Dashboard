# Dashboard API Integration Guide

## Overview

The React dashboard requires a specific API endpoint structure. You have two options:

## Option 1: Create a Dashboard-Specific Endpoint (Recommended)

Add a new endpoint to your API that returns all data the dashboard needs in one call.

### Endpoint Specification

**URL:** `GET /api/dashboard/sentiment`

**Query Parameters:**
- `days` (optional) - Number of days to retrieve (1-365)
- `hours` (optional) - Number of hours to retrieve (1-8760, overrides `days` if set)
- `symbols` (optional) - Comma-separated coin symbols (e.g., "BTC,ETH,SOL")

**Time Range Priority:**
- If `hours` is provided, it takes priority and `days` is ignored
- If only `days` is provided, it uses days
- Default is 7 days if neither is provided

**Response Format:**
```json
{
  "records": [
    {
      "symbol": "BTC",
      "coin_name": "Bitcoin",
      "sentiment": 0.75,
      "date": "2025-10-15T12:00:00Z",
      "explanation": "Positive market sentiment...",
      "article_title": "Bitcoin Rises on Strong Demand",
      "source": "CoinDesk",
      "relevance": 0.92
    }
  ],
  "signals": {
    "BTC": {
      "symbol": "BTC",
      "signal": "STRONG BUY",
      "strength": 0.85,
      "avg_sentiment": 0.65,
      "recent_sentiment": 0.75,
      "trend": 0.1,
      "mentions": 142,
      "coin_name": "Bitcoin"
    }
  },
  "total_records": 1250,
  "unique_coins": 50
}
```

### Examples

```bash
# Get sentiment for last 7 days (default)
GET /api/dashboard/sentiment

# Get sentiment for last hour
GET /api/dashboard/sentiment?hours=1

# Get sentiment for last 24 hours
GET /api/dashboard/sentiment?hours=24

# Get sentiment for last 30 days
GET /api/dashboard/sentiment?days=30

# Get specific coins for last 6 hours
GET /api/dashboard/sentiment?hours=6&symbols=BTC,ETH,SOL
```

### Implementation

Add this to your `api_server.py`:

```python
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta
import pymysql
from pydantic import BaseModel

router = APIRouter()

class SentimentRecord(BaseModel):
    symbol: str
    coin_name: str
    sentiment: float
    date: str
    explanation: str
    article_title: str
    source: str
    relevance: float

class TradingSignal(BaseModel):
    symbol: str
    signal: str  # STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL
    strength: float
    avg_sentiment: float
    recent_sentiment: float
    trend: float
    mentions: int
    coin_name: str

class DashboardResponse(BaseModel):
    records: List[SentimentRecord]
    signals: dict
    total_records: int
    unique_coins: int

def calculate_trading_signals(records: List[dict]) -> dict:
    """Calculate trading signals from sentiment records"""
    signals = {}
    
    # Group by symbol
    by_symbol = {}
    for record in records:
        symbol = record['symbol']
        if symbol not in by_symbol:
            by_symbol[symbol] = []
        by_symbol[symbol].append(record)
    
    # Calculate signals for each symbol
    for symbol, data in by_symbol.items():
        sorted_data = sorted(data, key=lambda x: x['date'], reverse=True)
        
        avg_sentiment = sum(r['sentiment'] for r in data) / len(data)
        recent_data = sorted_data[:min(5, len(data))]
        recent_sentiment = sum(r['sentiment'] for r in recent_data) / len(recent_data)
        sentiment_trend = recent_sentiment - avg_sentiment
        mention_count = len(data)
        
        # Determine signal
        signal = 'NEUTRAL'
        strength = 0.0
        
        if recent_sentiment > 0.3 and sentiment_trend > 0.1:
            signal = 'STRONG BUY'
            strength = min(1.0, recent_sentiment + sentiment_trend)
        elif recent_sentiment > 0.1:
            signal = 'BUY'
            strength = recent_sentiment
        elif recent_sentiment < -0.3 and sentiment_trend < -0.1:
            signal = 'STRONG SELL'
            strength = abs(min(-1.0, recent_sentiment + sentiment_trend))
        elif recent_sentiment < -0.1:
            signal = 'SELL'
            strength = abs(recent_sentiment)
        
        signals[symbol] = {
            'symbol': symbol,
            'signal': signal,
            'strength': strength,
            'avg_sentiment': avg_sentiment,
            'recent_sentiment': recent_sentiment,
            'trend': sentiment_trend,
            'mentions': mention_count,
            'coin_name': data[0]['coin_name']
        }
    
    return signals

@router.get("/dashboard/sentiment", response_model=DashboardResponse)
async def get_dashboard_sentiment(
    days: int = Query(7, ge=1, le=365, description="Number of days to retrieve"),
    symbols: Optional[str] = Query(None, description="Comma-separated coin symbols")
):
    """
    Get sentiment data optimized for dashboard display
    
    Returns sentiment records with calculated trading signals.
    """
    try:
        from libs.json_to_mariadb import DatabaseConfig
        
        config = DatabaseConfig(use_external=True)
        connection = pymysql.connect(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password,
            database=config.database,
            charset=config.charset,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        cursor = connection.cursor()
        
        # Build query
        query = """
        SELECT 
            cs.symbol,
            cs.coin_name,
            cs.sentiment,
            cs.date,
            cs.explanation,
            cn.title as article_title,
            cn.source,
            cs.relevance
        FROM coinsentiment cs
        JOIN crypto_news cn ON cs.article_id = cn.id
        WHERE cs.date >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """
        
        params = [days]
        
        if symbols:
            symbol_list = [s.strip().upper() for s in symbols.split(',')]
            placeholders = ','.join(['%s'] * len(symbol_list))
            query += f" AND cs.symbol IN ({placeholders})"
            params.extend(symbol_list)
        
        query += " ORDER BY cs.date DESC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Convert datetime to ISO string
        records = []
        for row in results:
            if isinstance(row['date'], datetime):
                row['date'] = row['date'].isoformat()
            records.append(row)
        
        # Calculate trading signals
        signals = calculate_trading_signals(records)
        
        # Get unique coins count
        unique_coins = len(set(r['symbol'] for r in records))
        
        cursor.close()
        connection.close()
        
        return DashboardResponse(
            records=records,
            signals=signals,
            total_records=len(records),
            unique_coins=unique_coins
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add to your main app
# app.include_router(router, prefix="/api")
```

### Enable CORS

Add CORS middleware to allow the React app to access the API:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite default port
        # Add your production URLs here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Option 2: Use Existing Endpoints (Less Efficient)

You could modify the React app to make multiple API calls:

1. Call `/v1/sentiments?from=...&symbol=...` to get sentiment records
2. Process the paginated response
3. Calculate trading signals client-side
4. Aggregate statistics client-side

**Drawbacks:**
- Multiple HTTP requests = slower
- More data transferred
- More complex client code
- Signal calculation done in browser (heavier)

---

## Recommended Approach

**Use Option 1** - Create the dashboard-specific endpoint because:

✅ **Single HTTP request** - faster loading  
✅ **Server-side signal calculation** - more efficient  
✅ **Optimized response** - only the data needed  
✅ **Cleaner client code** - simpler to maintain  
✅ **Better caching** - easier to cache one endpoint  

---

## Update the React App to Use Real API

Once you've added the endpoint, update the dashboard:

### 1. Create `.env` file

```bash
cd Dashboard
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

### 2. Update the API service

Edit `Dashboard/src/hooks/useSentimentData.ts`:

```typescript
export const useSentimentData = (params: FetchSentimentParams = {}) => {
  return useQuery({
    queryKey: ['sentiment', params],
    queryFn: () => fetchSentimentData(params), // Use real API instead of mock
    refetchInterval: 60000,
  });
};
```

The `fetchSentimentData` function in `Dashboard/src/services/api.ts` is already configured correctly!

---

## Testing

### 1. Start your API server
```bash
python api_server.py
```

### 2. Test the endpoint
```bash
curl "http://localhost:8000/api/dashboard/sentiment?days=7" | jq
```

### 3. Start the dashboard
```bash
cd Dashboard
npm run dev
```

### 4. Open in browser
Navigate to `http://localhost:3000`

---

## OpenAPI Enhancement (Optional)

If you want to add this endpoint to your OpenAPI spec, add this to `openapi.yaml`:

```yaml
  /dashboard/sentiment:
    get:
      tags:
        - Dashboard
      summary: Get dashboard sentiment data
      description: Optimized endpoint for dashboard display with trading signals
      operationId: getDashboardSentiment
      parameters:
        - name: days
          in: query
          description: Number of days to retrieve (1-365)
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 365
            default: 7
        - name: symbols
          in: query
          description: Comma-separated coin symbols (e.g., BTC,ETH,SOL)
          required: false
          schema:
            type: string
            example: BTC,ETH
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  records:
                    type: array
                    items:
                      $ref: '#/components/schemas/Sentiment'
                  signals:
                    type: object
                    additionalProperties:
                      $ref: '#/components/schemas/TradingSignal'
                  total_records:
                    type: integer
                  unique_coins:
                    type: integer
```

And add the TradingSignal schema:

```yaml
    TradingSignal:
      type: object
      properties:
        symbol:
          type: string
        signal:
          type: string
          enum: [STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL]
        strength:
          type: number
          format: float
        avg_sentiment:
          type: number
          format: float
        recent_sentiment:
          type: number
          format: float
        trend:
          type: number
          format: float
        mentions:
          type: integer
        coin_name:
          type: string
```

---

## Summary

**Answer to your question:** The existing endpoints in `openapi.yaml` are NOT optimal for the dashboard. They would work but require multiple calls and client-side processing.

**Recommendation:** Add the `/api/dashboard/sentiment` endpoint using the code above for the best performance and developer experience.

