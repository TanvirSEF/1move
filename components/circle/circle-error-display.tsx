/**
 * Professional Error Display Component for Circle.so API
 * Shows detailed error information with troubleshooting steps
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailedError, CircleApiError } from '@/types/circle';

interface CircleErrorDisplayProps {
  error: DetailedError;
  onRetry?: () => void;
  onClearError?: () => void;
  isRetrying?: boolean;
  className?: string;
}

// Error type to user-friendly message mapping
const ERROR_MESSAGES: Record<CircleApiError, { title: string; description: string; color: string }> = {
  CLOUDFLARE_BLOCKED: {
    title: 'Cloudflare Protection Active',
    description: 'The API is protected by Cloudflare security measures.',
    color: 'orange',
  },
  INVALID_CREDENTIALS: {
    title: 'Authentication Failed',
    description: 'Your API key or community ID is incorrect.',
    color: 'red',
  },
  RATE_LIMITED: {
    title: 'Rate Limit Exceeded',
    description: 'Too many requests. Please wait before trying again.',
    color: 'yellow',
  },
  NETWORK_ERROR: {
    title: 'Network Connection Error',
    description: 'Unable to connect to the Circle.so API.',
    color: 'red',
  },
  INVALID_RESPONSE: {
    title: 'Invalid API Response',
    description: 'The API returned an unexpected response format.',
    color: 'orange',
  },
  TIMEOUT: {
    title: 'Request Timeout',
    description: 'The API request took too long to complete.',
    color: 'yellow',
  },
  UNKNOWN_ERROR: {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
    color: 'red',
  },
};

// Troubleshooting steps for each error type
const TROUBLESHOOTING_STEPS: Record<CircleApiError, string[]> = {
  CLOUDFLARE_BLOCKED: [
    'Wait a few minutes and try again',
    'Check if you can access Circle.so directly in your browser',
    'Contact Circle.so support if the issue persists',
  ],
  INVALID_CREDENTIALS: [
    'Verify your API key in the Circle.so admin panel',
    'Check that your community ID is correct',
    'Ensure your API key has member read permissions',
    'Make sure environment variables are properly set',
  ],
  RATE_LIMITED: [
    'Wait for the rate limit to reset (usually 1 hour)',
    'Reduce the frequency of API calls',
    'Contact Circle.so to increase your rate limits',
  ],
  NETWORK_ERROR: [
    'Check your internet connection',
    'Verify that Circle.so is accessible',
    'Try again in a few minutes',
    'Check if there are any firewall restrictions',
  ],
  INVALID_RESPONSE: [
    'Try refreshing the data',
    'Check if Circle.so has updated their API',
    'Contact support if the issue persists',
  ],
  TIMEOUT: [
    'Try again with a smaller page size',
    'Check your internet connection speed',
    'The API might be experiencing high load',
  ],
  UNKNOWN_ERROR: [
    'Try refreshing the page',
    'Check the browser console for more details',
    'Contact support with the error details',
  ],
};

export function CircleErrorDisplay({
  error,
  onRetry,
  onClearError,
  isRetrying = false,
  className,
}: CircleErrorDisplayProps) {
  const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.UNKNOWN_ERROR;
  const troubleshootingSteps = TROUBLESHOOTING_STEPS[error.type] || TROUBLESHOOTING_STEPS.UNKNOWN_ERROR;

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'red': return 'destructive';
      case 'yellow': return 'secondary';
      case 'orange': return 'secondary';
      default: return 'destructive';
    }
  };

  return (
    <Card className={`p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 ${className}`}>
      <div className="space-y-4">
        {/* Error Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant(errorInfo.color)} className="text-xs">
                ❌ {error.type.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {error.timestamp.toLocaleString()}
              </span>
            </div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              {errorInfo.title}
            </h3>
            <p className="text-red-700 dark:text-red-300">
              {errorInfo.description}
            </p>
          </div>
          
          {onClearError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              ✕
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error.message && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200 font-mono">
              {error.message}
            </p>
          </div>
        )}

        {/* Troubleshooting Steps */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Troubleshooting Steps:
          </h4>
          <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {troubleshootingSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Retrying...
                </>
              ) : (
                '🔄 Try Again'
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://circle.so/help', '_blank')}
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            📚 Circle.so Help
          </Button>
        </div>

        {/* Debug Information */}
        {error.details && (
          <details className="text-sm">
            <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium">
              🔧 Debug Information
            </summary>
            <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto">
              <pre className="whitespace-pre-wrap text-red-800 dark:text-red-200">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}
