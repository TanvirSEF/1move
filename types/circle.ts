// File: types/circle.ts
// Comprehensive TypeScript interfaces for Circle.so API integration

export interface Member {
  id: string;
  name: string;
  email: string;
  created_at: string;
  invited_by?: {
    id: string;
    name: string;
    email: string;
  } | null;
  // Invitation link used to join
  invitation_link?: {
    id: string;
    url: string;
    name?: string;
  };
}

export interface BrokerDetail {
  brokerId: string;
  brokerName: string;
  referredCount: number;
}

export interface InvitationLink {
  id: string;
  url: string;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
  expires_at?: string;
  is_active?: boolean;
  usage_count?: number;
  max_uses?: number;
  // Members who joined through this invitation link
  joined_members?: Member[];
}

export interface SummaryStats {
  totalMembers: number;
  totalBrokers: number;
  totalInvitationLinks: number;
  brokerDetails: BrokerDetail[];
  invitationLinks: InvitationLink[];
}

export interface CircleApiResponse {
  data?: Member[];
  members?: Member[];
  error?: string;
  message?: string;
}

export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  details?: {
    endpoint: string;
    status: number;
    contentType: string;
    responseSize: number;
    isCloudflareBlocked: boolean;
  };
  error?: string;
}

export interface CloudflareBypassConfig {
  endpoints: string[];
  retryDelays: number[];
  timeout: number;
}

export interface FetchOptions {
  page?: number;
  perPage?: number;
  timeout?: number;
  maxRetries?: number;
}

// Utility types for API responses
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// Extended member interface with additional Circle.so fields
export interface ExtendedMember extends Member {
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  is_admin?: boolean;
  is_moderator?: boolean;
  joined_at?: string;
  last_seen_at?: string;
  post_count?: number;
  comment_count?: number;
}

// Broker statistics with additional metrics
export interface ExtendedBrokerDetail extends BrokerDetail {
  conversionRate?: number;
  averageTimeToRefer?: number;
  mostRecentReferral?: string;
  oldestReferral?: string;
  referralTrend?: 'increasing' | 'decreasing' | 'stable';
}

// Dashboard state management types
export interface DashboardState {
  stats: SummaryStats;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
  connectionStatus: 'unknown' | 'connected' | 'blocked' | 'error';
}

export interface DashboardActions {
  fetchData: () => void;
  testConnection: () => void;
  clearError: () => void;
  refreshData: () => void;
}

// API endpoint configuration
export interface ApiEndpointConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

// Error types for better error handling
export type CircleApiError = 
  | 'CLOUDFLARE_BLOCKED'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface DetailedError {
  type: CircleApiError;
  message: string;
  details?: any;
  timestamp: Date;
  endpoint?: string;
  statusCode?: number;
}

// Pagination types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Filter and sorting types
export interface MemberFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasBroker?: boolean;
  brokerIds?: string[];
  searchTerm?: string;
}

export interface SortOptions {
  field: keyof Member | 'referralCount';
  direction: 'asc' | 'desc';
}

// Chart data types for visualization
export interface ChartDataPoint {
  date: string;
  members: number;
  brokers: number;
  referrals: number;
}

export interface BrokerChartData {
  brokerName: string;
  referrals: number;
  percentage: number;
}

// All types are already exported above
