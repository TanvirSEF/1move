/**
 * Comprehensive Circle.so API V2 Testing
 * Tests different API approaches based on the official documentation
 * GET /api/test/circle-api-v2
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Circle.so API V2 approaches...');
    
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

    const baseUrl = 'https://app.circle.so/api/admin/v2';
    
    // Test different API approaches based on Circle.so V2 documentation
    const approaches = [
      {
        name: 'Current Invitation Links',
        url: `${baseUrl}/invitation_links?per_page=10`,
        description: 'Current approach - invitation links only'
      },
      {
        name: 'Invitation Links with Include',
        url: `${baseUrl}/invitation_links?per_page=10&include=members,users,invited_users`,
        description: 'Try to include member data in invitation links'
      },
      {
        name: 'Members with Invitation Data',
        url: `${baseUrl}/community_members?per_page=10&include=invitation_link,invited_by`,
        description: 'Try to get invitation link data with members'
      },
      {
        name: 'Invitations Endpoint',
        url: `${baseUrl}/invitations?per_page=10`,
        description: 'Check if there\'s a separate invitations endpoint'
      },
      {
        name: 'Members with Extended Fields',
        url: `${baseUrl}/community_members?per_page=10&fields=id,name,email,invitation_link_id,invited_by_id`,
        description: 'Try to explicitly request invitation-related fields'
      }
    ];

    const results = [];

    for (const approach of approaches) {
      try {
        console.log(`🔄 Testing: ${approach.name}`);
        
        const response = await fetch(approach.url, {
          method: 'GET',
          headers,
          cache: 'no-store',
        });

        const data = await response.ok ? await response.json() : null;
        
        results.push({
          name: approach.name,
          description: approach.description,
          url: approach.url,
          status: response.status,
          success: response.ok,
          data: data ? {
            // Analyze the response structure
            hasRecords: !!data.records,
            recordCount: data.records?.length || 0,
            sampleRecord: data.records?.[0] || null,
            sampleRecordFields: data.records?.[0] ? Object.keys(data.records[0]) : [],
            // Check for member-related fields
            hasMemberData: data.records?.[0]?.members ? true : false,
            hasInvitationData: data.records?.[0]?.invitation_link ? true : false,
            hasInvitedByData: data.records?.[0]?.invited_by ? true : false,
            // Raw response (truncated)
            rawResponse: JSON.stringify(data).substring(0, 1000) + '...'
          } : null,
          error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
        });

        console.log(`✅ ${approach.name}: ${response.status}`);
        
      } catch (error) {
        results.push({
          name: approach.name,
          description: approach.description,
          url: approach.url,
          status: 0,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`❌ ${approach.name}: ${error}`);
      }
    }

    // Analyze results to find the best approach
    const successfulApproaches = results.filter(r => r.success);
    const approachesWithMemberData = successfulApproaches.filter(r => 
      r.data?.hasMemberData || r.data?.hasInvitationData || r.data?.hasInvitedByData
    );

    const analysis = {
      totalApproaches: approaches.length,
      successfulApproaches: successfulApproaches.length,
      approachesWithMemberData: approachesWithMemberData.length,
      recommendedApproach: approachesWithMemberData[0]?.name || 'No approach found with member data',
      summary: {
        currentApproachWorks: results[0]?.success || false,
        memberDataAvailable: approachesWithMemberData.length > 0,
        bestEndpoint: approachesWithMemberData[0]?.url || null
      }
    };

    console.log('✅ Circle.so API V2 testing completed');
    return NextResponse.json({
      success: true,
      analysis,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API V2 testing error:', error);
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
