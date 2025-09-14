/**
 * Debug API Route for Invitation Links
 * GET /api/debug/invitation-links
 */

import { NextResponse } from 'next/server';
import { getInvitationLinkStats } from '@/lib/api/circle';

export async function GET() {
  try {
    console.log('🔍 Debug API: Fetching invitation link data...');
    
    const result = await getInvitationLinkStats();
    
    if (result.success) {
      console.log('✅ Debug API: Successfully fetched data');
      return NextResponse.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        endpoint: 'debug/invitation-links'
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
