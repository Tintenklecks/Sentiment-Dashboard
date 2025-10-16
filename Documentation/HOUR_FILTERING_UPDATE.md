# Hour-Based Filtering Update

## Summary

Added support for hour-based time filtering in both the API and React dashboard.

## Changes Made

### Backend API (`dashboard_api_endpoint.py`)

**New Parameters:**
- `hours` (optional, 1-8760): Number of hours to retrieve
- `days` (optional, 1-365): Number of days to retrieve

**Logic:**
- If `hours` is provided, it takes priority and `days` is ignored
- If only `days` is provided, it uses days
- Default is 7 days if neither is provided
- Uses `DATE_SUB(NOW(), INTERVAL X HOUR)` or `DATE_SUB(NOW(), INTERVAL X DAY)`

**Example Queries:**
```sql
-- Last hour
WHERE cs.date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)

-- Last 24 hours
WHERE cs.date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

-- Last 7 days
WHERE cs.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

### Frontend Dashboard

**Updated Files:**
1. `src/services/api.ts` - Added `hours` parameter to API calls
2. `src/hooks/useSentimentData.ts` - Support hours in mock data
3. `src/components/Dashboard.tsx` - New UI with hour/day selector

**New UI Features:**
```
Time Range Selector:
├── Hours
│   ├── Last hour
│   ├── Last 3 hours
│   ├── Last 6 hours
│   ├── Last 12 hours
│   └── Last 24 hours
└── Days
    ├── Last 3 days
    ├── Last 7 days (default)
    ├── Last 14 days
    ├── Last 30 days
    └── Last 90 days
```

## API Examples

### Using cURL

```bash
# Last hour
curl "http://localhost:8000/api/dashboard/sentiment?hours=1" | jq

# Last 6 hours for specific coins
curl "http://localhost:8000/api/dashboard/sentiment?hours=6&symbols=BTC,ETH" | jq

# Last 30 days (traditional)
curl "http://localhost:8000/api/dashboard/sentiment?days=30" | jq

# Default (7 days)
curl "http://localhost:8000/api/dashboard/sentiment" | jq
```

### Using Python

```python
import requests

# Last hour
response = requests.get(
    "http://localhost:8000/api/dashboard/sentiment",
    params={"hours": 1}
)
data = response.json()

# Last 3 hours for BTC and ETH
response = requests.get(
    "http://localhost:8000/api/dashboard/sentiment",
    params={
        "hours": 3,
        "symbols": "BTC,ETH"
    }
)
data = response.json()
```

### Using JavaScript/TypeScript

```typescript
// In the React app
const { data } = useSentimentData({ hours: 1 }); // Last hour
const { data } = useSentimentData({ hours: 24 }); // Last 24 hours
const { data } = useSentimentData({ days: 7 }); // Last 7 days (default)
```

## Benefits

### For Real-Time Monitoring
- Track sentiment changes within the last hour
- Identify rapid sentiment shifts
- React to breaking news quickly

### For Trend Analysis
- Compare hourly vs daily sentiment
- Identify intraday patterns
- Better granularity for trading decisions

### For API Users
- More flexible time ranges
- Cleaner than using fractional days (1/24, 3/24, etc.)
- Intuitive parameter names

## Use Cases

### 1. Real-Time Alert Dashboard
```typescript
// Check every minute for sentiment changes in last hour
const { data } = useSentimentData({ 
  hours: 1,
  refetchInterval: 60000 
});
```

### 2. Intraday Trading Signals
```bash
# Get signals for last 6 hours
curl "http://localhost:8000/api/dashboard/sentiment?hours=6"
```

### 3. Compare Short vs Long Term
```typescript
const hourData = useSentimentData({ hours: 1 });
const dayData = useSentimentData({ days: 7 });

// Compare signals
const shortTermSignal = hourData.data.signals['BTC'];
const longTermSignal = dayData.data.signals['BTC'];
```

## Testing

### Test the API
```bash
cd /Users/server/Production/SentimentDB

# Make sure database has recent data
python run_coin_sentiment_analysis.py

# Start API server
python api_server.py

# Test endpoints
curl "http://localhost:8000/api/dashboard/sentiment?hours=1" | jq '.total_records'
curl "http://localhost:8000/api/dashboard/sentiment?hours=24" | jq '.total_records'
curl "http://localhost:8000/api/dashboard/sentiment?days=7" | jq '.total_records'
```

### Test the Dashboard
```bash
cd Dashboard

# The dashboard is already running with hour support
# Just open http://localhost:3000 and use the dropdown selector
```

## Migration Notes

### From Old to New

**Old way** (days only):
```bash
GET /api/dashboard/sentiment?days=7
```

**New way** (hours or days):
```bash
GET /api/dashboard/sentiment?hours=24    # Last 24 hours
GET /api/dashboard/sentiment?days=7      # Last 7 days (still works)
```

### Backward Compatibility
✅ Fully backward compatible - existing code using `days` parameter will continue to work

### Breaking Changes
❌ None - this is an additive change

## Performance Considerations

### Hour-Based Queries
- Queries with `hours=1` will return fewer records → faster
- Good for real-time monitoring
- Lower memory usage

### Day-Based Queries  
- Queries with `days=30` return more records
- Better for trend analysis
- More comprehensive signals

### Recommendations
- Use `hours` for real-time dashboards and alerts
- Use `days` for historical analysis and trends
- Cache results appropriately based on time range

## Next Steps

1. ✅ Backend API updated with `hours` parameter
2. ✅ Frontend UI updated with hour/day selector
3. ✅ Documentation updated
4. ⬜ Add to your `api_server.py` (just include the router)
5. ⬜ Test with real database
6. ⬜ Deploy to production

## Questions?

Check the integration guide:
- `Dashboard/INTEGRATION_GUIDE.md` - Full API integration details
- `dashboard_api_endpoint.py` - Complete endpoint implementation
- `Dashboard/README.md` - Dashboard setup and usage

