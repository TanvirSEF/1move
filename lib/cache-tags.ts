/**
 * Cache Tags for Next.js Cache Revalidation
 * Centralized cache tag definitions
 */

export const CACHE_TAGS = {
  CIRCLE_MEMBERS: 'circle-members',
  CIRCLE_CONNECTION: 'circle-connection',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
