/**
 * Raw Member Data API Route
 * GET /api/debug/members
 */

import { NextResponse } from 'next/server';
import { fetchCircleMembers } from '@/lib/api/circle';
import { InvitationLink } from '@/types/circle';

export async function GET() {
  try {
    console.log('🔍 Debug API: Fetching raw member data...');
    
    const result = await fetchCircleMembers();
    
    if (result.success) {
      // Get sample members to see their structure
      const sampleMembers = result.data.invitationLinks?.[0]?.joined_members?.slice(0, 2) || [];
      
      console.log('✅ Debug API: Successfully fetched data');
      return NextResponse.json({
        success: true,
        summary: {
          totalMembers: result.data.totalMembers,
          totalBrokers: result.data.totalBrokers,
          totalInvitationLinks: result.data.totalInvitationLinks,
          membersThroughLinks: result.data.invitationLinks?.reduce((sum: number, link: InvitationLink) => sum + (link.joined_members?.length || 0), 0) || 0,
        },
        sampleMembers,
        sampleInvitationLinks: result.data.invitationLinks?.slice(0, 2) || [],
        timestamp: new Date().toISOString(),
        endpoint: 'debug/members'
      });
    } else {
      console.error('❌ Debug API: Failed to fetch data:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Debug API: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
        timestamp: new Date(),
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
