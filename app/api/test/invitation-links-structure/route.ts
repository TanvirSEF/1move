/**
 * Test Invitation Links API Structure
 * GET /api/test/invitation-links-structure
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing invitation links API structure...');
    
    const apiKey = process.env.CIRCLE_API_KEY;
    const communityId = process.env.CIRCLE_COMMUNITY_ID;
    
    if (!apiKey || !communityId) {
      return NextResponse.json({
        success: false,
        error: 'Missing API credentials',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const headers = {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const endpoint = `https://app.circle.so/api/admin/v2/invitation_links?per_page=10`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Analyze the structure
    const analysis = {
      totalLinks: data.records?.length || 0,
      sampleLink: data.records?.[0] || null,
      sampleLinkFields: data.records?.[0] ? Object.keys(data.records[0]) : [],
      hasMembersField: data.records?.[0]?.members ? true : false,
      hasJoinedMembersField: data.records?.[0]?.joined_members ? true : false,
      hasUsersField: data.records?.[0]?.users ? true : false,
      usageCount: data.records?.[0]?.usage_count || 0,
      rawResponse: data
    };

    console.log('✅ Invitation links API structure analyzed');
    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

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
