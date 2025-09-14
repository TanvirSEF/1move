/**
 * Test API Route for Pagination Fix
 * GET /api/test/pagination
 */

import { NextResponse } from 'next/server';
import { fetchCircleMembers } from '@/lib/api/circle';

export async function GET() {
  try {
    console.log('🧪 Testing pagination fix...');
    
    const startTime = Date.now();
    const result = await fetchCircleMembers();
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    
    if (result.success) {
      console.log(`✅ Test completed in ${duration}ms`);
      return NextResponse.json({
        success: true,
        data: {
          totalMembers: result.data.totalMembers,
          totalBrokers: result.data.totalBrokers,
          totalInvitationLinks: result.data.totalInvitationLinks,
        },
        duration: `${duration}ms`,
        endpoint: result.endpoint,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Test failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test error:', error);
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
