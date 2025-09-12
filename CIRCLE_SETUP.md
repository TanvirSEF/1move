# Circle.so API Integration Setup Guide

## Overview
This guide will help you set up the Circle.so API integration with advanced Cloudflare bypass techniques for your Next.js dashboard.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Circle.so API Configuration
CIRCLE_API_KEY=NR8H5AJZ28AWManMf5Ura1oNBGjd1c3e
CIRCLE_COMMUNITY_ID=370251
```

### How to Get Your API Credentials

1. **API Key**: 
   - Go to your Circle.so admin panel
   - Navigate to Settings > API
   - Generate or copy your API token

2. **Community ID**:
   - Found in your Circle.so admin URL
   - Or available in API responses
   - Should be a numeric value

## Features Implemented

### 1. Advanced Cloudflare Bypass (`app/dashboard/actions.ts`)
- **Multiple Endpoints**: Tries different Circle.so domain variations
- **Realistic Browser Headers**: Complete set of Sec-Fetch-* headers
- **Retry Logic**: Exponential backoff (1s, 2s, 4s delays)
- **Cloudflare Detection**: Identifies HTML challenge pages
- **Pagination Support**: Automatically fetches all members across pages

### 2. Modern Dashboard UI (`app/dashboard/page.tsx`)
- **Server Actions**: Uses Next.js 15 server actions with useTransition
- **Loading States**: Professional skeleton loading
- **Error Handling**: Detailed error messages with retry functionality
- **Real-time Status**: Connection testing and last update timestamps
- **Broker Analytics**: Top brokers table with referral statistics
- **Working Implementation**: Uses simple-actions.ts for reliable API calls

### 4. Comprehensive Types (`types/circle.ts`)
- **Full TypeScript Support**: Complete interface definitions
- **Extended Types**: Additional fields for future enhancements
- **Error Types**: Detailed error categorization

## API Endpoints

### Server Actions (Recommended)
```typescript
import { fetchCircleMembers, testCircleConnection } from './actions';

// Fetch all member data with statistics
const result = await fetchCircleMembers();

// Test API connection
const testResult = await testCircleConnection();
```

### Backup API Routes
```javascript
// Fetch member statistics
GET /api/circle-proxy

// Test connection
GET /api/circle-proxy?test=true

// Alternative testing methods
POST /api/circle-proxy
{
  "method": "minimal|custom|default",
  "endpoint": "custom_endpoint_url",
  "headers": { "custom": "headers" }
}
```

## Data Structure

The API returns comprehensive member statistics:

```typescript
interface SummaryStats {
  totalMembers: number;
  totalBrokers: number;
  brokerDetails: Array<{
    brokerId: string;
    brokerName: string;
    brokerEmail: string;
    referredCount: number;
    referredMembers: Array<{
      id: string;
      name: string;
      email: string;
      created_at: string;
    }>;
  }>;
}
```

## Cloudflare Bypass Techniques

### 1. Browser-like Headers
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  // ... more headers
}
```

### 2. Multiple Endpoint Strategy
- `https://app.circle.so/api/v1`
- `https://circle.so/api/v1`
- `https://api.circle.so/v1`
- `https://www.circle.so/api/v1`

### 3. Retry Logic with Delays
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay

### 4. Response Validation
- Content-type checking
- HTML challenge detection
- JSON parsing validation

## Usage Examples

### Basic Usage
```typescript
"use client";
import { useState, useTransition } from "react";
import { fetchCircleMembers } from "./actions";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchCircleMembers();
      if (result.success) {
        setStats(result.data);
      }
    });
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={isPending}>
        {isPending ? "Loading..." : "Fetch Data"}
      </button>
      {stats && (
        <div>
          <p>Total Members: {stats.totalMembers}</p>
          <p>Total Brokers: {stats.totalBrokers}</p>
        </div>
      )}
    </div>
  );
}
```

### Error Handling
```typescript
const result = await fetchCircleMembers();

if (!result.success) {
  console.error("API Error:", result.error);
  
  // Common error types:
  // - "Cloudflare challenge detected"
  // - "Missing required environment variables"
  // - "Failed to fetch from all endpoints"
  // - "Invalid response structure"
}
```

## Troubleshooting

### Common Issues

1. **Cloudflare Blocking**
   - Check console logs for "Cloudflare challenge detected"
   - Try the test connection button
   - Verify API credentials are correct

2. **Environment Variables**
   - Ensure `.env.local` file exists
   - Restart development server after adding variables
   - Check variable names match exactly

3. **API Rate Limits**
   - Circle.so may have rate limits
   - The implementation includes delays between requests
   - Monitor console logs for rate limit errors

4. **Network Issues**
   - Check internet connection
   - Try different endpoints using the test functionality
   - Verify Circle.so service status

### Debug Mode

Enable detailed logging by checking the browser console and server logs. All requests include comprehensive logging:

- 🚀 Starting requests
- 🔄 Retry attempts
- ✅ Successful responses
- ❌ Error details
- 📊 Response analysis
- 🎉 Completion summaries

## Performance Considerations

- **Pagination**: Automatically handles large member lists
- **Caching**: Consider implementing caching for production
- **Rate Limiting**: Built-in delays to respect API limits
- **Error Recovery**: Multiple fallback strategies

## Security Notes

- API keys are server-side only
- No sensitive data exposed to client
- Environment variables properly secured
- CORS headers handled appropriately

## Future Enhancements

- [ ] Add caching layer (Redis/Memory)
- [ ] Implement webhook support
- [ ] Add member activity tracking
- [ ] Create broker performance analytics
- [ ] Add export functionality
- [ ] Implement real-time updates

## Support

If you encounter issues:

1. Check the browser console for detailed error logs
2. Use the "Test Connection" button to diagnose API access
3. Verify your Circle.so API credentials
4. Check Circle.so service status
5. Review the comprehensive error messages in the UI

The implementation includes extensive error handling and debugging information to help identify and resolve issues quickly.
