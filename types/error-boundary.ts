import { ErrorInfo, ReactNode } from 'react';

/**
 * Error severity levels for categorization and handling
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for better error handling and reporting
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  CHUNK_LOAD = 'chunk_load',
  UNKNOWN = 'unknown',
}

/**
 * Recovery strategies for different error types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  RELOAD = 'reload',
  REDIRECT = 'redirect',
  FALLBACK = 'fallback',
  NONE = 'none',
}

/**
 * Enhanced error information with metadata
 */
export interface ErrorDetails {
  /** Original error object */
  error: Error;
  /** React error info with component stack */
  errorInfo?: ErrorInfo;
  /** Error category for handling */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Suggested recovery strategy */
  recoveryStrategy: RecoveryStrategy;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** User ID if available */
  userId?: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
  /** Component name where error occurred */
  componentName?: string;
  /** Error boundary instance ID */
  boundaryId?: string;
}

/**
 * Error boundary state interface
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Detailed error information */
  errorDetails?: ErrorDetails;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Error ID for tracking */
  errorId?: string;
}

/**
 * Error boundary configuration options
 */
export interface ErrorBoundaryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to show detailed errors in development */
  showDetailedErrors?: boolean;
  /** Custom error reporter function */
  onError?: (errorDetails: ErrorDetails) => void | Promise<void>;
  /** Custom retry handler */
  onRetry?: (errorDetails: ErrorDetails, retryCount: number) => void | Promise<void>;
  /** Custom recovery handler */
  onRecover?: (errorDetails: ErrorDetails) => void | Promise<void>;
  /** Fallback component to render on error */
  fallback?: ReactNode | ((errorDetails: ErrorDetails) => ReactNode);
  /** Whether to isolate errors to prevent cascading */
  isolateErrors?: boolean;
  /** Custom error categorization function */
  categorizeError?: (error: Error, errorInfo?: ErrorInfo) => ErrorCategory;
  /** Custom severity assessment function */
  assessSeverity?: (error: Error, category: ErrorCategory) => ErrorSeverity;
  /** Custom recovery strategy selector */
  selectRecoveryStrategy?: (error: Error, category: ErrorCategory, severity: ErrorSeverity) => RecoveryStrategy;
  /** Environment-specific settings */
  environment?: 'development' | 'production' | 'test';
  /** Component name for identification */
  componentName?: string;
  /** Unique boundary identifier */
  boundaryId?: string;
}

/**
 * Error boundary props interface
 */
export interface ErrorBoundaryProps extends ErrorBoundaryConfig {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom error UI component */
  errorComponent?: React.ComponentType<ErrorBoundaryUIProps>;
}

/**
 * Props for error UI components
 */
export interface ErrorBoundaryUIProps {
  /** Error details */
  errorDetails: ErrorDetails;
  /** Retry function */
  onRetry: () => void;
  /** Reset function */
  onReset: () => void;
  /** Whether retry is available */
  canRetry: boolean;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Current retry count */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Environment mode */
  isDevelopment: boolean;
}

/**
 * Async error context for hook-based error handling
 */
export interface AsyncErrorContext {
  /** Report an async error */
  reportError: (error: Error, metadata?: Record<string, unknown>) => void;
  /** Clear all async errors */
  clearErrors: () => void;
  /** Current async errors */
  errors: ErrorDetails[];
  /** Whether there are any errors */
  hasErrors: boolean;
}

/**
 * Error reporter interface for external services
 */
export interface ErrorReporter {
  /** Report error to external service */
  report: (errorDetails: ErrorDetails) => Promise<void> | void;
  /** Configure reporter settings */
  configure?: (config: Record<string, unknown>) => void;
  /** Check if reporter is available */
  isAvailable?: () => boolean;
}

/**
 * Error logging interface
 */
export interface ErrorLogger {
  /** Log error with specified level */
  log: (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: unknown) => void;
  /** Log error details */
  logError: (errorDetails: ErrorDetails) => void;
  /** Log retry attempt */
  logRetry: (errorDetails: ErrorDetails, retryCount: number) => void;
  /** Log recovery action */
  logRecovery: (errorDetails: ErrorDetails, action: string) => void;
}

/**
 * Error boundary metrics interface
 */
export interface ErrorBoundaryMetrics {
  /** Total errors caught */
  totalErrors: number;
  /** Errors by category */
  errorsByCategory: Record<ErrorCategory, number>;
  /** Errors by severity */
  errorsBySeverity: Record<ErrorSeverity, number>;
  /** Successful recoveries */
  successfulRecoveries: number;
  /** Failed recoveries */
  failedRecoveries: number;
  /** Average time to recovery */
  averageRecoveryTime: number;
}
