/**
 * Professional Control Panel for Circle.so Dashboard
 * Provides data refresh, connection testing, and status monitoring
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCircleConnectionTest } from '@/hooks/use-circle-data';

interface CircleControlPanelProps {
  isLoading: boolean;
  lastFetch: Date | null;
  endpoint: string | null;
  hasError: boolean;
  hasData: boolean;
  onRefresh: () => void;
  onClearError?: () => void;
  className?: string;
}

export function CircleControlPanel({
  isLoading,
  lastFetch,
  endpoint,
  hasError,
  hasData,
  onRefresh,
  onClearError,
  className,
}: CircleControlPanelProps) {
  const connectionTest = useCircleConnectionTest();

  const handleConnectionTest = () => {
    connectionTest.runTest();
  };

  const showConnectionResults = () => {
    if (!connectionTest.results) return;

    const results = connectionTest.results
      .map(r => 
        `${r.endpoint}\n` +
        `  Status: ${r.status}\n` +
        `  Content: ${r.contentType}\n` +
        `  JSON: ${r.isJson ? 'Yes' : 'No'}\n` +
        `  Cloudflare: ${r.isCloudflare ? 'Yes' : 'No'}\n` +
        `  Response Time: ${r.responseTime}ms\n` +
        `  Preview: ${r.preview.substring(0, 100)}...`
      )
      .join('\n\n');

    alert(`Connection Test Results:\n\n${results}`);
  };

  // Determine status
  const getStatus = () => {
    if (isLoading) return { text: 'Loading...', color: 'blue', icon: '🔄' };
    if (hasError) return { text: 'Error', color: 'red', icon: '❌' };
    if (hasData && endpoint) return { text: 'Connected', color: 'green', icon: '✅' };
    return { text: 'Unknown', color: 'gray', icon: '❓' };
  };

  const status = getStatus();

  return (
    <Card className={`p-4 bg-muted/50 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Status Information */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">Circle.so API Status</h3>
            <Badge 
              variant={status.color === 'green' ? 'default' : status.color === 'red' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {status.icon} {status.text}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {/* Last Update */}
            <span>
              {lastFetch 
                ? `Updated: ${lastFetch.toLocaleTimeString()}`
                : "No data loaded"
              }
            </span>
            
            {/* Working Endpoint */}
            {endpoint && (
              <Badge variant="outline" className="text-xs">
                Endpoint: {endpoint.split('/').pop()}
              </Badge>
            )}
            
            {/* Data Freshness */}
            {lastFetch && (
              <span className={`${
                Date.now() - lastFetch.getTime() > 5 * 60 * 1000 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {Date.now() - lastFetch.getTime() > 5 * 60 * 1000 ? '⚠️ Stale' : '✨ Fresh'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Connection Test Button */}
          <Button 
            onClick={handleConnectionTest}
            variant="outline" 
            size="sm"
            disabled={connectionTest.isLoading}
            className="text-xs"
          >
            {connectionTest.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                Testing...
              </>
            ) : (
              '🧪 Test Connection'
            )}
          </Button>

          {/* Show Results Button */}
          {connectionTest.hasResults && (
            <Button
              onClick={showConnectionResults}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              📊 View Results
            </Button>
          )}

          {/* Clear Error Button */}
          {hasError && onClearError && (
            <Button
              onClick={onClearError}
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/20"
            >
              ✕ Clear Error
            </Button>
          )}

          {/* Refresh Button */}
          <Button 
            onClick={onRefresh}
            size="sm"
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                Loading...
              </>
            ) : (
              '🔄 Refresh Data'
            )}
          </Button>
        </div>
      </div>

      {/* Connection Test Error */}
      {connectionTest.hasError && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
          <span className="text-red-700 dark:text-red-300">
            Connection test failed: {connectionTest.error}
          </span>
        </div>
      )}

      {/* Quick Stats */}
      {hasData && lastFetch && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Data Age</div>
              <div className="text-sm font-medium">
                {Math.round((Date.now() - lastFetch.getTime()) / 1000 / 60)}m
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="text-sm font-medium">
                {status.text}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Auto Refresh</div>
              <div className="text-sm font-medium">
                5m
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
