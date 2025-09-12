/**
 * Professional Dashboard Client Component
 * Handles all client-side interactions and state management
 */

'use client';

import React from 'react';
import { useAdvancedCircleData } from '@/hooks/use-circle-data';
import { CircleStatsCard } from '@/components/circle/circle-stats-card';
import { CircleErrorDisplay } from '@/components/circle/circle-error-display';
import { BrokerTable } from '@/components/circle/broker-table';
import { CircleControlPanel } from '@/components/circle/circle-control-panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardClientProps {
  // Optional initial data from server-side rendering
  initialData?: {
    data: any;
    endpoint: string;
    timestamp: number;
  } | null;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const {
    data: stats,
    error,
    isLoading,
    lastFetch,
    endpoint,
    hasData,
    hasError,
    refresh,
    clearError,
    connectionTest,
    retryWithBackoff,
    status,
  } = useAdvancedCircleData();

  // Handle retry with exponential backoff
  const handleRetryWithBackoff = () => {
    retryWithBackoff(3); // Retry up to 3 times
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          
          {/* Control Panel */}
          <div className="px-4 lg:px-6">
            <CircleControlPanel
              isLoading={isLoading}
              lastFetch={lastFetch}
              endpoint={endpoint}
              hasError={hasError}
              hasData={hasData}
              onRefresh={refresh}
              onClearError={clearError}
            />
          </div>

          {/* Error Display */}
          {hasError && error && (
            <div className="px-4 lg:px-6">
              <CircleErrorDisplay
                error={error}
                onRetry={refresh}
                onClearError={clearError}
                isRetrying={isLoading}
              />
            </div>
          )}

          {/* Loading State (when no data) */}
          {isLoading && !hasData && (
            <div className="px-4 lg:px-6">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <div className="space-y-1">
                    <span className="font-medium">Loading Circle.so data...</span>
                    <div className="text-sm text-muted-foreground">
                      Testing API endpoints and fetching member statistics
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Success State - Stats Cards */}
          {stats && (
            <div className="px-4 lg:px-6">
              <CircleStatsCard
                stats={stats}
                isLoading={isLoading}
                lastFetch={lastFetch}
                endpoint={endpoint}
              />
            </div>
          )}

          {/* Broker Table */}
          {stats && stats.brokerDetails.length > 0 && (
            <div className="px-4 lg:px-6">
              <BrokerTable
                brokers={stats.brokerDetails}
                totalMembers={stats.totalMembers}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* No Data State */}
          {!isLoading && !hasData && !hasError && (
            <div className="px-4 lg:px-6">
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📊</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Welcome to Circle.so Analytics</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Click "Refresh Data" to load your member statistics and broker analytics.
                    </p>
                  </div>
                  <Button onClick={refresh} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '🚀 Load Data'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Fallback Options */}
          {hasError && !hasData && (
            <div className="px-4 lg:px-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Alternative Options</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={handleRetryWithBackoff}
                      disabled={isLoading}
                      className="justify-start"
                    >
                      🔄 Retry with Backoff
                      <span className="ml-auto text-xs text-muted-foreground">
                        Smart retry
                      </span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={connectionTest.runTest}
                      disabled={connectionTest.isLoading}
                      className="justify-start"
                    >
                      {connectionTest.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          🧪 Test All Endpoints
                          <span className="ml-auto text-xs text-muted-foreground">
                            Diagnose
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="pt-3 border-t text-sm text-muted-foreground">
                    <p>
                      If the API continues to fail, you can manually import your member data 
                      or contact Circle.so support for assistance.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Debug Panel (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="px-4 lg:px-6">
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  🔧 Debug Information
                </summary>
                <Card className="p-4 mt-2">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                      status,
                      hasData,
                      hasError,
                      isLoading,
                      lastFetch: lastFetch?.toISOString(),
                      endpoint,
                      connectionTestResults: connectionTest.hasResults,
                      statsPreview: stats ? {
                        totalMembers: stats.totalMembers,
                        totalBrokers: stats.totalBrokers,
                        topBroker: stats.brokerDetails[0]?.brokerName || 'None'
                      } : null
                    }, null, 2)}
                  </pre>
                </Card>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
