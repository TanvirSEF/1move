'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Users, AlertTriangle } from 'lucide-react';

import { InvitationLink } from '@/types/circle';

interface InvitationLinksSummaryProps {
  invitationLinks: InvitationLink[];
  totalMembers: number;
}

export default function InvitationLinksSummary({ 
  invitationLinks, 
  totalMembers 
}: InvitationLinksSummaryProps) {
  const [sortedLinks, setSortedLinks] = useState<InvitationLink[]>([]);

  useEffect(() => {
    // Sort by usage_count descending (this is what the API provides)
    const sorted = [...invitationLinks].sort((a, b) => 
      (b.usage_count || 0) - (a.usage_count || 0)
    );
    setSortedLinks(sorted);
  }, [invitationLinks]);

  const totalJoinedThroughLinks = invitationLinks.reduce(
    (sum, link) => sum + (link.usage_count || 0), 
    0
  );

  const activeLinks = invitationLinks.filter(link => link.is_active);
  const inactiveLinks = invitationLinks.filter(link => !link.is_active);

  return (
    <div className="space-y-6">
      {/* API Limitation Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>API Limitation:</strong> Circle.so Admin API V2 only provides member counts, not individual member details or invitation link URLs. 
          To see actual member names and details, you need to use the Circle.so web interface.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invitation Links</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitationLinks.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeLinks.length} active, {inactiveLinks.length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members Through Links</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJoinedThroughLinks}</div>
            <p className="text-xs text-muted-foreground">
              {((totalJoinedThroughLinks / totalMembers) * 100).toFixed(1)}% of total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Link</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedLinks[0]?.usage_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {sortedLinks[0]?.created_by?.name || `Link ${sortedLinks[0]?.id || 'None'}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Link</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitationLinks.length > 0 
                ? (totalJoinedThroughLinks / invitationLinks.length).toFixed(1)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              members per link
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Links */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Invitation Links</CardTitle>
          <CardDescription>
            Links with the most usage (API only provides counts, not member details)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedLinks.slice(0, 10).map((link, index) => (
              <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {link.created_by?.name || `Invitation Link ${link.id}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={link.is_active ? "default" : "secondary"}>
                    {link.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{link.usage_count || 0}</div>
                    <div className="text-xs text-muted-foreground">uses</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>How to See Member Details</CardTitle>
          <CardDescription>
            The Circle.so Admin API V2 doesn&apos;t provide member-invitation link relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Option 1: Use Circle.so Web Interface</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Access the full member details through the Circle.so dashboard
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://1move.circle.so/audience/manage', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Circle.so Dashboard
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Option 2: Contact Circle.so Support</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Request access to invitation link URLs and member relationships via API
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://support.circle.so', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
