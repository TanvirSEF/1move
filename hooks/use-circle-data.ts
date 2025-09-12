/**
 * Professional React hooks for Circle.so data management
 * Provides clean, reusable data fetching with proper state management
 */

'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { SummaryStats, DetailedError } from '@/types/circle';
import { 
  getCachedCircleMembers, 
  testCircleConnectionAction, 
  refreshCircleData 
} from '@/app/actions/circle-actions';

// Local storage keys
const STORAGE_KEYS = {
  CIRCLE_DATA: 'circle-data-v2',
  LAST_FETCH: 'circle-last-fetch-v2',
} as const;

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface CircleDataState {
  data: SummaryStats | null;
  error: DetailedError | null;
  isLoading: boolean;
  lastFetch: Date | null;
  endpoint: string | null;
}

interface ConnectionTestState {
  results: Array<{
    endpoint: string;
    status: number;
    contentType: string;
    isJson: boolean;
    isCloudflare: boolean;
    preview: string;
    responseTime: number;
  }> | null;
  error: string | null;
  isLoading: boolean;
  lastTest: Date | null;
}

/**
 * Main hook for Circle.so member data
 */
export function useCircleData() {
  const [state, setState] = useState<CircleDataState>({
    data: null,
    error: null,
    isLoading: false,
    lastFetch: null,
    endpoint: null,
  });
  
  const [isPending, startTransition] = useTransition();

  // Load cached data from localStorage
  const loadCachedData = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CIRCLE_DATA);
      const lastFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
      
      if (cached && lastFetch) {
        const data = JSON.parse(cached);
        const fetchTime = new Date(lastFetch);
        const age = Date.now() - fetchTime.getTime();
        
        // Return cached data if it's fresh
        if (age < CACHE_DURATION) {
          return {
            data: data.stats,
            endpoint: data.endpoint,
            lastFetch: fetchTime,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load cached Circle data:', error);
    }
    
    return null;
  }, []);

  // Save data to localStorage
  const saveCachedData = useCallback((data: SummaryStats, endpoint: string) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = {
        stats: data,
        endpoint,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEYS.CIRCLE_DATA, JSON.stringify(cacheData));
      localStorage.setItem(STORAGE_KEYS.LAST_FETCH, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to cache Circle data:', error);
    }
  }, []);

  // Fetch fresh data
  const fetchData = useCallback(async (force = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    startTransition(async () => {
      try {
        const result = force 
          ? await refreshCircleData()
          : await getCachedCircleMembers();

        if (result.success) {
          const newState = {
            data: result.data,
            error: null,
            isLoading: false,
            lastFetch: new Date(result.timestamp),
            endpoint: result.endpoint,
          };
          
          setState(newState);
          saveCachedData(result.data, result.endpoint);
          
          console.log('✅ Circle data loaded successfully');
        } else {
          setState(prev => ({
            ...prev,
            error: result.error,
            isLoading: false,
          }));
          
          console.error('❌ Failed to load Circle data:', result.error);
        }
      } catch (error) {
        const errorDetails: DetailedError = {
          type: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unexpected error',
          details: { originalError: error },
          timestamp: new Date(),
        };
        
        setState(prev => ({
          ...prev,
          error: errorDetails,
          isLoading: false,
        }));
        
        console.error('❌ Client-side error:', error);
      }
    });
  }, [saveCachedData]);

  // Refresh data (force fetch)
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load cached data on mount and fetch fresh data
  useEffect(() => {
    const cached = loadCachedData();
    
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached.data,
        endpoint: cached.endpoint,
        lastFetch: cached.lastFetch,
      }));
    }
    
    // Always try to fetch fresh data
    fetchData();
  }, [fetchData, loadCachedData]);

  return {
    ...state,
    isLoading: state.isLoading || isPending,
    refresh,
    clearError,
    // Computed properties
    hasData: !!state.data,
    hasError: !!state.error,
    isFresh: state.lastFetch ? (Date.now() - state.lastFetch.getTime()) < CACHE_DURATION : false,
  };
}

/**
 * Hook for Circle.so connection testing
 */
export function useCircleConnectionTest() {
  const [state, setState] = useState<ConnectionTestState>({
    results: null,
    error: null,
    isLoading: false,
    lastTest: null,
  });
  
  const [isPending, startTransition] = useTransition();

  const runTest = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    startTransition(async () => {
      try {
        const result = await testCircleConnectionAction();
        
        setState({
          results: result.results,
          error: result.error || null,
          isLoading: false,
          lastTest: new Date(result.timestamp),
        });
        
        if (result.success) {
          console.log('🧪 Connection test completed successfully');
        } else {
          console.error('❌ Connection test failed:', result.error);
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Test failed',
          isLoading: false,
        }));
        
        console.error('❌ Connection test error:', error);
      }
    });
  }, []);

  const clearResults = useCallback(() => {
    setState({
      results: null,
      error: null,
      isLoading: false,
      lastTest: null,
    });
  }, []);

  return {
    ...state,
    isLoading: state.isLoading || isPending,
    runTest,
    clearResults,
    hasResults: !!state.results,
    hasError: !!state.error,
  };
}

/**
 * Hook for managing Circle.so data with advanced features
 */
export function useAdvancedCircleData() {
  const circleData = useCircleData();
  const connectionTest = useCircleConnectionTest();
  
  // Auto-refresh data every 5 minutes when tab is active
  useEffect(() => {
    if (!circleData.hasData) return;

    const interval = setInterval(() => {
      if (!document.hidden && circleData.isFresh === false) {
        circleData.refresh();
      }
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [circleData.hasData, circleData.isFresh, circleData.refresh]);

  // Retry failed requests with exponential backoff
  const retryWithBackoff = useCallback(async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      
      circleData.refresh();
      
      // Wait for the request to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (circleData.hasData && !circleData.hasError) {
        break;
      }
    }
  }, [circleData]);

  return {
    ...circleData,
    connectionTest,
    retryWithBackoff,
    // Computed status
    status: circleData.isLoading 
      ? 'loading' 
      : circleData.hasError 
        ? 'error' 
        : circleData.hasData 
          ? 'success' 
          : 'idle',
  };
}
