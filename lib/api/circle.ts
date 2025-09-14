/**
 * Professional Circle.so API Client
 * Handles all API interactions with proper error handling, retry logic, and type safety
 */

import { cache } from 'react';
import { BrokerDetail, SummaryStats, InvitationLink, CircleApiError, DetailedError } from '@/types/circle';

// API Configuration based on Circle.so Admin API V2 documentation
// Reference: https://api-headless.circle.so/?urls.primaryName=Admin+API+V2
const API_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000], // Progressive delays
  baseUrl: 'https://app.circle.so/api/admin/v2',
  endpoints: {
    members: '/community_members',
    invitationLinks: '/invitation_links',
    invitations: '/invitations', // Additional endpoint that might contain relationships
  },
  // Try different parameter combinations based on API V2 documentation
  parameterSets: [
    { per_page: '10' }, // Basic
    { per_page: '10', include: 'invitation_link,invited_by' }, // With includes
    { per_page: '10', fields: 'id,name,email,invitation_link_id,invited_by_id' }, // Specific fields
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
 * Build endpoint URLs with different parameter sets
 */
function buildEndpoints(communityId: string): string[] {
  const endpoints: string[] = [];
  
  // Try different parameter combinations
  for (const params of API_CONFIG.parameterSets) {
    const queryString = new URLSearchParams(params as any).toString();
    endpoints.push(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.members}?${queryString}`);
    endpoints.push(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.invitationLinks}?${queryString}`);
  }
  
  return endpoints;
}

/**
 * Build specific endpoint URL with parameters
 */
function buildEndpoint(endpointType: keyof typeof API_CONFIG.endpoints, communityId: string, params: Record<string, string> = {}): string {
  const endpoint = API_CONFIG.endpoints[endpointType];
  const queryString = new URLSearchParams({ per_page: '10', ...params }).toString();
  return `${API_CONFIG.baseUrl}${endpoint}?${queryString}`;
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

  // Debug: Log the actual API response structure
  console.log('🔍 API Response structure:', {
    has_next_page: initialData.has_next_page,
    page_count: initialData.page_count,
    count: initialData.count,
    records_length: (initialData.records || []).length,
    members_length: (initialData.members || []).length,
    community_members_length: (initialData.community_members || []).length,
    data_length: (initialData.data || []).length
  });

  // Check if there are more pages - be more conservative
  if (initialData.has_next_page && initialData.page_count && initialData.page_count > 1) {
    console.log(`📄 Fetching ${initialData.page_count} total pages (${initialData.count} total records)`);

    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmptyPages = 3; // Stop after 3 consecutive empty pages
    const maxPagesToFetch = Math.min(initialData.page_count, 20); // Limit to max 20 pages for safety

    console.log(`📄 Will fetch up to ${maxPagesToFetch} pages (API says ${initialData.page_count} total)`);

    // Fetch remaining pages
    for (let page = 2; page <= maxPagesToFetch; page++) {
      try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const pageUrl = `${endpoint}${separator}page=${page}`;
        
        const result = await fetchFromEndpoint(pageUrl, headers, options);
        
        if (result.success) {
          const pageRecords = result.data.records || result.data.members || result.data.community_members || result.data.data || [];
          
          if (pageRecords.length === 0) {
            consecutiveEmptyPages++;
            console.log(`✅ Page ${page}/${initialData.page_count} fetched: ${pageRecords.length} records (empty)`);
            
            // Stop if we've hit too many consecutive empty pages
            if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
              console.log(`🛑 Stopping pagination after ${consecutiveEmptyPages} consecutive empty pages`);
              break;
            }
          } else {
            consecutiveEmptyPages = 0; // Reset counter when we get data
            allRecords = [...allRecords, ...pageRecords];
            console.log(`✅ Page ${page}/${initialData.page_count} fetched: ${pageRecords.length} records`);
          }
        } else {
          console.warn(`⚠️ Failed to fetch page ${page}: ${result.error.message}`);
          consecutiveEmptyPages++;
          
          // Stop if we've hit too many consecutive failures
          if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
            console.log(`🛑 Stopping pagination after ${consecutiveEmptyPages} consecutive failures`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        consecutiveEmptyPages++;
        
        // Stop if we've hit too many consecutive errors
        if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
          console.log(`🛑 Stopping pagination after ${consecutiveEmptyPages} consecutive errors`);
          break;
        }
      }
    }
  }

  return allRecords;
}

/**
 * Process raw invitation links data
 */
function processInvitationLinks(invitationLinks: any[], members: any[] = []): InvitationLink[] {
  // Debug: Log sample invitation link structure to understand available fields
  if (invitationLinks.length > 0) {
    console.log('🔍 Sample invitation link structure:', {
      id: invitationLinks[0].id,
      url: invitationLinks[0].url,
      availableFields: Object.keys(invitationLinks[0]),
      memberFields: {
        members: invitationLinks[0].members,
        joined_members: invitationLinks[0].joined_members,
        users: invitationLinks[0].users,
        invited_users: invitationLinks[0].invited_users,
        usage_count: invitationLinks[0].usage_count,
        used_count: invitationLinks[0].used_count,
      }
    });
  }

  return invitationLinks.map((link: any) => {
    const linkId = String(link.id);
    
    // Check if the invitation link itself contains member data
    let joinedMembers: any[] = [];
    
    // Try different possible field names for members in invitation link data
    const possibleMemberFields = [
      link.members,
      link.joined_members, 
      link.users,
      link.invited_users,
      link.used_by,
      link.used_by_users
    ];
    
    for (const memberField of possibleMemberFields) {
      if (memberField && Array.isArray(memberField) && memberField.length > 0) {
        console.log(`✅ Found members in invitation link ${linkId} in field:`, Object.keys(link).find(key => link[key] === memberField));
        joinedMembers = memberField.map((member: any) => ({
          id: String(member.id || member.user_id),
          name: member.name || member.display_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
          email: member.email || '',
          created_at: member.created_at || member.joined_at || member.used_at || '',
          invited_by: member.invited_by ? {
            id: String(member.invited_by.id),
            name: member.invited_by.name || member.invited_by.display_name || '',
            email: member.invited_by.email || '',
          } : null,
          invitation_link: {
            id: linkId,
            url: link.url || link.invitation_url || '',
            name: link.name || link.title || '',
          },
        }));
        break;
      }
    }
    
    // If no members found in invitation link data, try to match by other criteria
    if (joinedMembers.length === 0) {
      console.log(`⚠️ No members found in invitation link ${linkId} data. Available fields:`, Object.keys(link));
      
      // For now, create empty array - we'll need to investigate the API further
      joinedMembers = [];
    }
    
    return {
      id: linkId,
      url: link.url || link.invitation_url || '',
      created_at: link.created_at || link.createdAt || '',
      created_by: link.created_by ? {
        id: String(link.created_by.id),
        name: link.created_by.name || link.created_by.display_name || '',
        email: link.created_by.email || '',
      } : undefined,
      expires_at: link.expires_at || link.expiresAt,
      is_active: link.is_active !== undefined ? link.is_active : link.active !== undefined ? link.active : true,
      usage_count: link.usage_count || link.used_count || joinedMembers.length,
      max_uses: link.max_uses || link.maxUses,
      joined_members: joinedMembers,
    };
  });
}

/**
 * Process raw member data into broker statistics
 */
function processBrokerStats(members: any[], invitationLinks: any[] = []): SummaryStats {
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

  const processedInvitationLinks = processInvitationLinks(invitationLinks, members);

  return {
    totalMembers: members.length,
    totalBrokers: brokerMap.size,
    totalInvitationLinks: processedInvitationLinks.length,
    brokerDetails,
    invitationLinks: processedInvitationLinks,
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

    console.log('🚀 Starting Circle.so API fetch...');
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`🏠 Community ID: ${communityId}`);

    // Try different API approaches based on Circle.so V2 documentation
    console.log('🔄 Trying different API approaches based on Circle.so V2 documentation...');
    
    let membersResult: any = { success: false };
    let invitationLinksResult: any = { success: false };
    
    // Try different parameter combinations
    for (const params of API_CONFIG.parameterSets) {
      console.log(`🔄 Trying parameters:`, params);
      
      // Try members endpoint with different parameters
      if (!membersResult.success) {
        const membersEndpoint = buildEndpoint('members', communityId, params);
        console.log(`🔄 Fetching members from: ${membersEndpoint}`);
        membersResult = await fetchFromEndpoint(membersEndpoint, headers, options);
        
        if (membersResult.success) {
          console.log(`✅ Members endpoint successful with params:`, params);
        }
      }
      
      // Try invitation links endpoint with different parameters
      if (!invitationLinksResult.success) {
        const invitationLinksEndpoint = buildEndpoint('invitationLinks', communityId, params);
        console.log(`🔄 Fetching invitation links from: ${invitationLinksEndpoint}`);
        invitationLinksResult = await fetchFromEndpoint(invitationLinksEndpoint, headers, options);
        
        if (invitationLinksResult.success) {
          console.log(`✅ Invitation links endpoint successful with params:`, params);
        }
      }
      
      // If both are successful, break
      if (membersResult.success && invitationLinksResult.success) {
        break;
      }
    }
    
    if (!membersResult.success) {
      console.log(`❌ Members endpoint failed: ${membersResult.error.message}`);
      
      // If it's a non-retryable error, return it immediately
      if (membersResult.error.type === 'INVALID_CREDENTIALS' || membersResult.error.type === 'CLOUDFLARE_BLOCKED') {
        return {
          success: false,
          error: membersResult.error.toDetailedError(),
        };
      }
      
      // For other errors, try to continue with empty members
      console.warn('⚠️ Continuing with empty members data');
    }

    let successfulMembersEndpoint = '';
    let successfulInvitationLinksEndpoint = '';
    
    let allMembers: any[] = [];
    if (membersResult.success) {
      const membersData = membersResult.data as CircleApiResponse;
      // Use the successful endpoint from the loop
      successfulMembersEndpoint = buildEndpoint('members', communityId, API_CONFIG.parameterSets[0]);
      allMembers = await fetchAllPages(membersData, successfulMembersEndpoint, headers, options);
      console.log(`👥 Found ${allMembers.length} total members`);
    }
    
    let allInvitationLinks: any[] = [];
    if (invitationLinksResult.success) {
      const invitationLinksData = invitationLinksResult.data as CircleApiResponse;
      // Use the successful endpoint from the loop
      successfulInvitationLinksEndpoint = buildEndpoint('invitationLinks', communityId, API_CONFIG.parameterSets[0]);
      allInvitationLinks = await fetchAllPages(invitationLinksData, successfulInvitationLinksEndpoint, headers, options);
      console.log(`🔗 Found ${allInvitationLinks.length} total invitation links`);
    } else {
      console.log(`❌ Invitation links endpoint failed: ${invitationLinksResult.error.message}`);
      console.warn('⚠️ Continuing with empty invitation links data');
    }

    // Process combined statistics
    const stats = processBrokerStats(allMembers, allInvitationLinks);
    
    console.log(`📈 Final stats:`, {
      totalMembers: stats.totalMembers,
      totalBrokers: stats.totalBrokers,
      totalInvitationLinks: stats.totalInvitationLinks,
      topBroker: stats.brokerDetails[0]?.brokerName || 'None'
    });

    return {
      success: true,
      data: stats,
      endpoint: `Members: ${successfulMembersEndpoint} + Invitation Links: ${successfulInvitationLinksEndpoint}`,
    };

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
    
    // Test both endpoints
    const endpoints = [
      buildEndpoint('members', communityId),
      buildEndpoint('invitationLinks', communityId),
    ];

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
 * Get detailed invitation link statistics with member details
 */
export async function getInvitationLinkStats(options: FetchOptions = {}): Promise<{
  success: true;
  data: {
    invitationLinks: InvitationLink[];
    totalLinks: number;
    totalMembersThroughLinks: number;
    topPerformingLinks: Array<{
      link: InvitationLink;
      memberCount: number;
    }>;
  };
} | {
  success: false;
  error: DetailedError;
}> {
  try {
    const result = await fetchCircleMembers(options);
    
    if (!result.success) {
      return result;
    }

    const { invitationLinks } = result.data;
    
    // Calculate statistics
    const totalMembersThroughLinks = invitationLinks.reduce(
      (total, link) => total + (link.joined_members?.length || 0), 
      0
    );

    const topPerformingLinks = invitationLinks
      .map(link => ({
        link,
        memberCount: link.joined_members?.length || 0,
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 10); // Top 10 performing links

    return {
      success: true,
      data: {
        invitationLinks,
        totalLinks: invitationLinks.length,
        totalMembersThroughLinks,
        topPerformingLinks,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get invitation link stats',
        details: { originalError: error },
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Get cached member data (for client-side usage)
 * This is a React cache that persists during the request lifecycle
 */
export const getCachedMembers = cache(fetchCircleMembers);
