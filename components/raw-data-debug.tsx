/**
 * Raw Data Debug Component
 * Shows the actual API responses to help debug the data structure
 */

'use client';

import { useState, useTransition } from 'react';
import { getCircleMembers } from '@/app/actions/circle-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RawDataDebug() {
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await getCircleMembers();
        
        if (result.success) {
          setData(result);
          console.log('🔍 Raw API Data:', result);
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
      <Card>
        <CardHeader>
          <CardTitle>Raw Data Debug</CardTitle>
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
          <CardTitle>Raw Data Debug</CardTitle>
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

  // Sample a few members to see their structure
  const sampleMembers = data.data?.invitationLinks?.[0]?.joined_members?.slice(0, 3) || [];
  const sampleInvitationLinks = data.data?.invitationLinks?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data Debug</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Members: {data.data?.totalMembers || 0}</span>
          <span>Total Links: {data.data?.totalInvitationLinks || 0}</span>
          <span>Members Through Links: {data.data?.invitationLinks?.reduce((sum: number, link: any) => sum + (link.joined_members?.length || 0), 0) || 0}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="links">Invitation Links</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{data.data?.totalMembers || 0}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{data.data?.totalInvitationLinks || 0}</div>
                <div className="text-sm text-muted-foreground">Invitation Links</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {data.data?.invitationLinks?.reduce((sum: number, link: any) => sum + (link.joined_members?.length || 0), 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Members Through Links</div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Issue Analysis</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <Badge variant={data.data?.totalBrokers === 0 ? "destructive" : "default"}>
                    {data.data?.totalBrokers === 0 ? "No Brokers Found" : `${data.data?.totalBrokers} Brokers`}
                  </Badge>
                  {' '}This suggests the member-invitation link relationship isn't being detected.
                </p>
                <p>
                  <Badge variant={data.data?.invitationLinks?.reduce((sum: number, link: any) => sum + (link.joined_members?.length || 0), 0) === 0 ? "destructive" : "default"}>
                    {data.data?.invitationLinks?.reduce((sum: number, link: any) => sum + (link.joined_members?.length || 0), 0) === 0 ? "No Member-Link Relationships" : "Some Relationships Found"}
                  </Badge>
                  {' '}This indicates if members are linked to invitation links.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            <h3 className="font-semibold">Sample Members (First 3)</h3>
            {sampleMembers.length > 0 ? (
              <div className="space-y-4">
                {sampleMembers.map((member: any, index: number) => (
                  <div key={member.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">Member {index + 1}</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(member, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No members found in invitation links. This suggests the relationship isn't being detected.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="links" className="space-y-4">
            <h3 className="font-semibold">Sample Invitation Links (First 3)</h3>
            {sampleInvitationLinks.length > 0 ? (
              <div className="space-y-4">
                {sampleInvitationLinks.map((link: any, index: number) => (
                  <div key={link.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">Link {index + 1}: {link.created_by?.name || 'Unknown'}</h4>
                    <div className="mb-2">
                      <Badge variant="outline">{link.joined_members?.length || 0} members</Badge>
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(link, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No invitation links found.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="raw" className="space-y-4">
            <h3 className="font-semibold">Complete Raw Data</h3>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
