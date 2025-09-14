/**
 * Server Actions for Circle.so API
 * Professional Next.js server actions with proper error handling
 */

'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { fetchCircleMembers, testCircleConnection, getInvitationLinkStats } from '@/lib/api/circle';
import { SummaryStats, DetailedError, InvitationLink } from '@/types/circle';
import { CACHE_TAGS } from '@/lib/cache-tags';

/**
 * Server action to fetch Circle.so members and invitation links with caching
 * Now fetches data from both endpoints: community_members and invitation_links
 */
export async function getCircleMembers(): Promise<{
  success: true;
  data: SummaryStats;
  endpoint: string;
  timestamp: number;
} | {
  success: false;
  error: DetailedError;
}> {
  try {
    const result = await fetchCircleMembers();
    
    if (result.success) {
      return {
        ...result,
        timestamp: Date.now(),
      };
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Server action failed',
        details: { originalError: error },
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Cached version of getCircleMembers (5 minute cache)
 */
export const getCachedCircleMembers = unstable_cache(
  getCircleMembers,
  ['circle-members'],
  {
    tags: [CACHE_TAGS.CIRCLE_MEMBERS],
    revalidate: 300, // 5 minutes
  }
);

/**
 * Server action to test Circle.so connection
 */
export async function testCircleConnectionAction(): Promise<{
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
  timestamp: number;
}> {
  try {
    const result = await testCircleConnection();
    return {
      ...result,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Connection test failed',
      timestamp: Date.now(),
    };
  }
}

/**
 * Revalidate Circle.so data cache
 */
export async function revalidateCircleData(): Promise<{ success: boolean; message: string }> {
  try {
    revalidateTag(CACHE_TAGS.CIRCLE_MEMBERS);
    revalidateTag(CACHE_TAGS.CIRCLE_CONNECTION);
    
    return {
      success: true,
      message: 'Cache revalidated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revalidate cache',
    };
  }
}

/**
 * Force refresh Circle.so data (bypasses cache)
 */
export async function refreshCircleData(): Promise<{
  success: true;
  data: SummaryStats;
  endpoint: string;
  timestamp: number;
} | {
  success: false;
  error: DetailedError;
}> {
  // Revalidate cache first
  await revalidateCircleData();
  
  // Fetch fresh data
  return getCircleMembers();
}

/**
 * Server action to get detailed invitation link statistics with member details
 */
export async function getInvitationLinkStatsAction(): Promise<{
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
  timestamp: number;
} | {
  success: false;
  error: DetailedError;
}> {
  try {
    const result = await getInvitationLinkStats();
    
    if (result.success) {
      return {
        ...result,
        timestamp: Date.now(),
      };
    }
    
    return result;
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
