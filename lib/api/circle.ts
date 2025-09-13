/**
 * Professional Circle.so API Client
 * Handles all API interactions with proper error handling, retry logic, and type safety
 */

import { cache } from 'react';
import { BrokerDetail, SummaryStats, CircleApiError, DetailedError } from '@/types/circle';

// API Configuration
const API_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000], // Progressive delays
  endpoints: [
    'https://app.circle.so/api/admin/v2/community_members',
  ],
} as const;

// Response types for different API versions
interface CircleApiResponse {
  records?: any[];
  members?: any[];
  community_members?: any[];
  data?: any[];
  has_next_page?: boolean;
  page_count?: number;
  count?: number;
}

interface ApiCredentials {
  apiKey: string;
  communityId: string;
}

interface FetchOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * Custom error class for Circle API errors
 */
export class CircleApiException extends Error {
  constructor(
    public type: CircleApiError,
    message: string,
    public details?: any,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'CircleApiException';
  }

  toDetailedError(): DetailedError {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: new Date(),
      endpoint: this.endpoint,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Get API credentials from environment variables
 */
function getCredentials(): ApiCredentials {
  const apiKey = process.env.CIRCLE_API_KEY;
  const communityId = process.env.CIRCLE_COMMUNITY_ID;

  if (!apiKey || !communityId) {
    throw new CircleApiException(
      'INVALID_CREDENTIALS',
      'Missing API credentials. Please check CIRCLE_API_KEY and CIRCLE_COMMUNITY_ID environment variables.'
    );
  }

  return { apiKey, communityId };
}

/**
 * Create request headers for Circle.so API
 */
function createHeaders(apiKey: string): HeadersInit {
  return {
    'Authorization': `Token ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://app.circle.so/',
    'Origin': 'https://app.circle.so',
  };
}

/**
 * Build endpoint URLs with community ID replacement
 */
function buildEndpoints(communityId: string): string[] {
  return API_CONFIG.endpoints.map(endpoint => 
    endpoint.replace('{communityId}', communityId)
  ).map(endpoint => `${endpoint}?per_page=100`);
}

/**
 * Check if response indicates Cloudflare blocking
 */
function isCloudflareBlocked(text: string): boolean {
  const indicators = [
    'checking your browser',
    'cloudflare',
    'ray id',
    'please wait while we check',
    'security check'
  ];
  
  const lowerText = text.toLowerCase();
  return indicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Determine error type from response
 */
function determineErrorType(status: number, contentType: string, responseText: string): CircleApiError {
  if (status === 401 || status === 403) return 'INVALID_CREDENTIALS';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 0 || status >= 500) return 'NETWORK_ERROR';
  if (isCloudflareBlocked(responseText)) return 'CLOUDFLARE_BLOCKED';
  if (!contentType.includes('application/json')) return 'INVALID_RESPONSE';
  return 'UNKNOWN_ERROR';
}

/**
 * Fetch data from a single endpoint with retry logic
 */
async function fetchFromEndpoint(
  endpoint: string,
  headers: HeadersInit,
  options: FetchOptions = {}
): Promise<{ success: true; data: any } | { success: false; error: CircleApiException }> {
  const { timeout = API_CONFIG.timeout, retries = API_CONFIG.maxRetries, signal } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add delay for retry attempts
      if (attempt > 0) {
        const delay = API_CONFIG.retryDelays[attempt - 1] || 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Combine signals if provided
      const combinedSignal = signal ? 
        AbortSignal.any([signal, controller.signal]) : 
        controller.signal;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      // Handle successful responses
      if (response.ok && contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText);
          return { success: true, data };
        } catch (parseError) {
          throw new CircleApiException(
            'INVALID_RESPONSE',
            'Failed to parse JSON response',
            { parseError, responseText: responseText.substring(0, 200) },
            response.status,
            endpoint
          );
        }
      }

      // Handle error responses
      const errorType = determineErrorType(response.status, contentType, responseText);
      
      // Don't retry for certain error types
      if (errorType === 'INVALID_CREDENTIALS' || errorType === 'CLOUDFLARE_BLOCKED') {
        throw new CircleApiException(
          errorType,
          `API request failed: ${response.status} ${response.statusText}`,
          { responseText: responseText.substring(0, 200) },
          response.status,
          endpoint
        );
      }

      // For other errors, continue to retry
      if (attempt === retries) {
        throw new CircleApiException(
          errorType,
          `API request failed after ${retries + 1} attempts: ${response.status} ${response.statusText}`,
          { responseText: responseText.substring(0, 200) },
          response.status,
          endpoint
        );
      }

    } catch (error) {
      if (error instanceof CircleApiException) {
        return { success: false, error };
      }

      // Handle network errors
      if (attempt === retries) {
        throw new CircleApiException(
          'NETWORK_ERROR',
          `Network error after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { originalError: error },
          undefined,
          endpoint
        );
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new CircleApiException('UNKNOWN_ERROR', 'Unexpected error in fetchFromEndpoint');
}

/**
 * Fetch all pages of data from a paginated endpoint
 */
async function fetchAllPages(
  initialData: CircleApiResponse,
  endpoint: string,
  headers: HeadersInit,
  options: FetchOptions = {}
): Promise<any[]> {
  let allRecords = initialData.records || initialData.members || initialData.community_members || initialData.data || [];

  // Check if there are more pages
  if (initialData.has_next_page && initialData.page_count && initialData.page_count > 1) {
    console.log(`📄 Fetching ${initialData.page_count} total pages (${initialData.count} total records)`);

    // Fetch remaining pages
    for (let page = 2; page <= initialData.page_count; page++) {
      try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const pageUrl = `${endpoint}${separator}page=${page}`;
        
        const result = await fetchFromEndpoint(pageUrl, headers, options);
        
        if (result.success) {
          const pageRecords = result.data.records || result.data.members || result.data.community_members || result.data.data || [];
          allRecords = [...allRecords, ...pageRecords];
          console.log(`✅ Page ${page}/${initialData.page_count} fetched: ${pageRecords.length} records`);
        } else {
          console.warn(`⚠️ Failed to fetch page ${page}: ${result.error.message}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
      }
    }
  }

  return allRecords;
}

/**
 * Process raw member data into broker statistics
 */
function processBrokerStats(members: any[]): SummaryStats {
  const brokerMap = new Map<string, { name: string; count: number }>();

  members.forEach((member: any) => {
    // Handle different member data structures
    const inviter = member.invited_by || member.inviter || member.referrer || member.inviter_user;
    const inviterId = member.inviter_id || member.invited_by_id || member.referrer_id;
    const inviterName = member.inviter_name || member.invited_by_name || member.referrer_name;

    if (inviter?.id) {
      const brokerId = String(inviter.id);
      const brokerName = (
        inviter.name || 
        inviter.display_name || 
        `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || 
        inviter.email || 
        'Unknown'
      ).trim();

      if (brokerMap.has(brokerId)) {
        brokerMap.get(brokerId)!.count += 1;
      } else {
        brokerMap.set(brokerId, { name: brokerName, count: 1 });
      }
    } else if (inviterId && inviterName) {
      const brokerId = String(inviterId);
      
      if (brokerMap.has(brokerId)) {
        brokerMap.get(brokerId)!.count += 1;
      } else {
        brokerMap.set(brokerId, { name: inviterName, count: 1 });
      }
    }
  });

  const brokerDetails: BrokerDetail[] = Array.from(brokerMap.entries())
    .map(([brokerId, info]) => ({
      brokerId,
      brokerName: info.name,
      referredCount: info.count,
    }))
    .sort((a, b) => b.referredCount - a.referredCount);

  return {
    totalMembers: members.length,
    totalBrokers: brokerMap.size,
    brokerDetails,
  };
}

/**
 * Main function to fetch Circle.so members with comprehensive error handling
 */
export async function fetchCircleMembers(options: FetchOptions = {}): Promise<{
  success: true;
  data: SummaryStats;
  endpoint: string;
} | {
  success: false;
  error: DetailedError;
}> {
  try {
    const { apiKey, communityId } = getCredentials();
    const headers = createHeaders(apiKey);
    const endpoints = buildEndpoints(communityId);

    console.log('🚀 Starting Circle.so API fetch...');
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`🏠 Community ID: ${communityId}`);

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      console.log(`🔄 Testing endpoint: ${endpoint}`);

      const result = await fetchFromEndpoint(endpoint, headers, options);

      if (result.success) {
        const data = result.data as CircleApiResponse;
        
        // Fetch all pages if paginated
        const allMembers = await fetchAllPages(data, endpoint, headers, options);
        
        if (allMembers.length === 0) {
          console.warn(`⚠️ Endpoint returned empty members list: ${endpoint}`);
          continue;
        }

        console.log(`👥 Found ${allMembers.length} total members`);
        
        // Process broker statistics
        const stats = processBrokerStats(allMembers);
        
        console.log(`📈 Final stats:`, {
          totalMembers: stats.totalMembers,
          totalBrokers: stats.totalBrokers,
          topBroker: stats.brokerDetails[0]?.brokerName || 'None'
        });

        return {
          success: true,
          data: stats,
          endpoint,
        };
      } else {
        console.log(`❌ Endpoint failed: ${result.error.message}`);
        
        // If it's a non-retryable error, return it immediately
        if (result.error.type === 'INVALID_CREDENTIALS' || result.error.type === 'CLOUDFLARE_BLOCKED') {
          return {
            success: false,
            error: result.error.toDetailedError(),
          };
        }
      }
    }

    // All endpoints failed
    throw new CircleApiException(
      'NETWORK_ERROR',
      'All API endpoints failed. This could be due to: 1) Incorrect API key/community ID, 2) API permissions, 3) Cloudflare blocking, or 4) API endpoint changes.'
    );

  } catch (error) {
    if (error instanceof CircleApiException) {
      return {
        success: false,
        error: error.toDetailedError(),
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: { originalError: error },
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Test API connection and return detailed results
 * Cached for 5 minutes to avoid spam
 */
export const testCircleConnection = cache(async (options: FetchOptions = {}): Promise<{
  success: boolean;
  results: Array<{
    endpoint: string;
    status: number;
    contentType: string;
    isJson: boolean;
    isCloudflare: boolean;
    preview: string;
    responseTime: number;
  }>;
  error?: string;
}> => {
  try {
    const { apiKey, communityId } = getCredentials();
    const headers = createHeaders(apiKey);
    const endpoints = buildEndpoints(communityId).slice(0, 3); // Test first 3 endpoints

    const results = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for tests

        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        results.push({
          endpoint,
          status: response.status,
          contentType,
          isJson: contentType.includes('application/json'),
          isCloudflare: isCloudflareBlocked(text),
          preview: text.substring(0, 150),
          responseTime,
        });

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results.push({
          endpoint,
          status: 0,
          contentType: 'error',
          isJson: false,
          isCloudflare: false,
          preview: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          responseTime,
        });
      }
    }

    return {
      success: true,
      results,
    };

  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Failed to test connection',
    };
  }
});

/**
 * Get cached member data (for client-side usage)
 * This is a React cache that persists during the request lifecycle
 */
export const getCachedMembers = cache(fetchCircleMembers);
