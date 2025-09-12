/**
 * Professional Circle.so Statistics Card Component
 * Displays member and broker statistics with loading and error states
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryStats } from '@/types/circle';

interface CircleStatsCardProps {
  stats: SummaryStats | null;
  isLoading: boolean;
  lastFetch?: Date | null;
  endpoint?: string | null;
  className?: string;
}

export function CircleStatsCard({ 
  stats, 
  isLoading, 
  lastFetch, 
  endpoint,
  className 
}: CircleStatsCardProps) {
  if (isLoading && !stats) {
    return (
      <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const topBroker = stats.brokerDetails[0];

  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {/* Total Members */}
      <Card className="p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Members</span>
            <Badge variant="secondary" className="text-xs">
              👥
            </Badge>
          </div>
          <span className="text-3xl font-bold text-primary">
            {formatNumber(stats.totalMembers)}
          </span>
          {lastFetch && (
            <span className="text-xs text-muted-foreground">
              Updated {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
      </Card>

      {/* Total Brokers */}
      <Card className="p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Brokers</span>
            <Badge variant="secondary" className="text-xs">
              🤝
            </Badge>
          </div>
          <span className="text-3xl font-bold text-blue-600">
            {formatNumber(stats.totalBrokers)}
          </span>
          {stats.totalMembers > 0 && (
            <span className="text-xs text-muted-foreground">
              {((stats.totalBrokers / stats.totalMembers) * 100).toFixed(1)}% of members
            </span>
          )}
        </div>
      </Card>

      {/* Top Broker */}
      <Card className="p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Top Broker</span>
            <Badge variant="secondary" className="text-xs">
              🏆
            </Badge>
          </div>
          {topBroker ? (
            <>
              <span className="text-lg font-semibold text-amber-600 truncate" title={topBroker.brokerName}>
                {topBroker.brokerName}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {formatNumber(topBroker.referredCount)} referrals
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {((topBroker.referredCount / stats.totalMembers) * 100).toFixed(1)}%
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-muted-foreground">
                No brokers yet
              </span>
              <span className="text-xs text-muted-foreground">
                Start referring members!
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Connection Status */}
      {endpoint && (
        <div className="md:col-span-3">
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  ✅ Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  API Endpoint: {endpoint.split('/').pop()}
                </span>
              </div>
              {lastFetch && (
                <span className="text-xs text-muted-foreground">
                  Last sync: {lastFetch.toLocaleString()}
                </span>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
