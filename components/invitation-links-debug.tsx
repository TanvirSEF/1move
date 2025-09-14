/**
 * Invitation Links Debug Component
 * Displays raw invitation link data with member details for debugging
 */

'use client';

import { useState, useTransition } from 'react';
import { getInvitationLinkStatsAction } from '@/app/actions/circle-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users, Link } from 'lucide-react';

export function InvitationLinksDebug() {
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());

  const fetchData = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await getInvitationLinkStatsAction();
        
        if (result.success) {
          setData(result.data);
          console.log('🔍 Debug Data:', result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    });
  };

  const toggleExpanded = (linkId: string) => {
    const newExpanded = new Set(expandedLinks);
    if (newExpanded.has(linkId)) {
      newExpanded.delete(linkId);
    } else {
      newExpanded.add(linkId);
    }
    setExpandedLinks(newExpanded);
  };

  if (!data && !isPending && !error) {
    fetchData();
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Invitation Links Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Invitation Links Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchData} disabled={isPending}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Invitation Links Debug
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Link className="h-4 w-4" />
            Total Links: {data?.totalLinks || 0}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Members Through Links: {data?.totalMembersThroughLinks || 0}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{data?.totalLinks || 0}</div>
              <div className="text-sm text-muted-foreground">Total Links</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{data?.totalMembersThroughLinks || 0}</div>
              <div className="text-sm text-muted-foreground">Members Through Links</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {data?.invitationLinks?.filter((link: any) => link.is_active).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </div>
          </div>

          {/* Top Performing Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Performing Links</h3>
            <div className="space-y-2">
              {data?.topPerformingLinks?.slice(0, 5).map((item: any, index: number) => (
                <div key={item.link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      #{index + 1} {item.link.created_by?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.link.url}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{item.memberCount} members</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Links with Members */}
          <div>
            <h3 className="text-lg font-semibold mb-3">All Links with Member Details</h3>
            <div className="space-y-4">
              {data?.invitationLinks?.map((link: any) => (
                <Collapsible key={link.id}>
                  <CollapsibleTrigger
                    onClick={() => toggleExpanded(link.id)}
                    className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedLinks.has(link.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">
                            {link.created_by?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {link.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={link.is_active ? 'default' : 'secondary'}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {link.joined_members?.length || 0} members
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 border-t bg-muted/20">
                      <div className="space-y-4">
                        {/* Link Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Created:</span>{' '}
                            <span className="text-muted-foreground">
                              {link.created_at ? new Date(link.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Usage Count:</span>{' '}
                            <span className="text-muted-foreground">{link.usage_count || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Max Uses:</span>{' '}
                            <span className="text-muted-foreground">{link.max_uses || 'Unlimited'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span>{' '}
                            <span className="text-muted-foreground">
                              {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>

                        {/* Members Table */}
                        {link.joined_members && link.joined_members.length > 0 ? (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Members ({link.joined_members.length})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Joined</TableHead>
                                  <TableHead>Invited By</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {link.joined_members.map((member: any) => (
                                  <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                      {member.invited_by?.name || 'Direct'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No members joined through this link
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Raw Data JSON */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Raw Data (JSON)</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
