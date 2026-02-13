/**
 * input: User input string, search engine preference
 * output: Navigation URL (direct URL or search query)
 * pos: Shared URL utility for address bar and new-tab page
 */

import type { SearchEngine } from "@/models/settings";

/**
 * Build navigation URL from user input
 */
export function buildNavigationUrl(input: string, searchEngine: SearchEngine): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // URL patterns: starts with http/https
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  // Looks like domain
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Search query
  const engines: Record<SearchEngine, string> = {
    google: "https://www.google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    baidu: "https://www.baidu.com/s?wd=",
  };

  return engines[searchEngine] + encodeURIComponent(trimmed);
}

/**
 * Extract hostname from URL
 */
export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
