import type { MatchType } from '../types';

export function matchesPattern(url: string, pattern: string, matchType: MatchType): boolean {
  if (!pattern) return true;

  const normalizedUrl = url.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  switch (matchType) {
    case 'startsWith':
      return normalizedUrl.startsWith(normalizedPattern);
    case 'endsWith':
      return normalizedUrl.endsWith(normalizedPattern);
    case 'equals':
      return normalizedUrl === normalizedPattern;
    default:
      return false;
  }
}
