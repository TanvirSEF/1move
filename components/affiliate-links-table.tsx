/**
 * Affiliate Links Table Component
 * Displays invitation links with their joined members
 */

'use client';

import { useState, useTransition } from 'react';
import { getInvitationLinkStatsAction } from '@/app/actions/circle-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface AffiliateLinksTableProps {
  className?: string;
}

export function AffiliateLinksTable({ className }: AffiliateLinksTableProps) {
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await getInvitationLinkStatsAction();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    });
  };

  if (!data && !isPending && !error) {
    fetchData();
  }

  if (isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Affiliate Links & Members</CardTitle>
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>Affiliate Links & Members</CardTitle>
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Affiliate Links & Members</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Links: {data?.totalLinks || 0}</span>
          <span>Members Through Links: {data?.totalMembersThroughLinks || 0}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Performing Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Performing Links</h3>
            <div className="space-y-2">
              {data?.topPerformingLinks?.slice(0, 5).map((item: any, index: number) => (
                <div key={item.link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.link.created_by?.name || 'Unknown'}</div>
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

          {/* Detailed Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3">All Links with Members</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members Joined</TableHead>
                  <TableHead>Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.invitationLinks?.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.created_by?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{link.created_by?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={link.is_active ? 'default' : 'secondary'}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {link.joined_members?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {link.joined_members?.length > 0 ? (
                          <div className="space-y-1">
                            {link.joined_members.slice(0, 3).map((member: any) => (
                              <div key={member.id} className="text-sm">
                                <div className="font-medium">{member.name}</div>
                                <div className="text-muted-foreground">{member.email}</div>
                              </div>
                            ))}
                            {link.joined_members.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{link.joined_members.length - 3} more...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No members</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
