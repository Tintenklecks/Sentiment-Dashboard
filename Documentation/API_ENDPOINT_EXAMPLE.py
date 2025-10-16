"""
Example API endpoint to integrate with the React Dashboard

Add this to your api_server.py to provide data to the dashboard
"""

from fastapi import APIRouter, Query
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
    signal: str
    strength: float
    avg_sentiment: float
    recent_sentiment: float
    trend: float
    mentions: int
    coin_name: str


class SentimentResponse(BaseModel):
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
        # Sort by date descending
        sorted_data = sorted(data, key=lambda x: x['date'], reverse=True)
        
        # Calculate metrics
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


@router.get("/sentiment", response_model=SentimentResponse)
async def get_sentiment_data(
    days: int = Query(7, description="Number of days to retrieve"),
    symbols: Optional[str] = Query(None, description="Comma-separated list of symbols")
):
    """
    Get sentiment data for the dashboard
    
    Example: /api/sentiment?days=7&symbols=BTC,ETH
    """
    try:
        # Database connection (use your existing config)
        from libs.json_to_mariadb import DatabaseConfig
        
        config = DatabaseConfig(use_external=True)
        connection = pymysql.connect(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password,
            database=config.database,
            charset=config.charset
        )
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
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
            symbol_list = [s.strip() for s in symbols.split(',')]
            placeholders = ','.join(['%s'] * len(symbol_list))
            query += f" AND cs.symbol IN ({placeholders})"
            params.extend(symbol_list)
        
        query += " ORDER BY cs.date DESC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Convert datetime to string
        records = []
        for row in results:
            row['date'] = row['date'].isoformat()
            records.append(row)
        
        # Calculate trading signals
        signals = calculate_trading_signals(records)
        
        # Get unique coins
        unique_coins = len(set(r['symbol'] for r in records))
        
        cursor.close()
        connection.close()
        
        return SentimentResponse(
            records=records,
            signals=signals,
            total_records=len(records),
            unique_coins=unique_coins
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add CORS middleware to your main app
"""
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router
app.include_router(router, prefix="/api")
"""

