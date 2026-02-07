/**
 * input: User search/URL input
 * output: Navigation to URL or search engine
 * pos: New tab starting page with search functionality
 */

"use client";

import React, { useState, useCallback, KeyboardEvent } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useSettingsStore } from "@/stores/settingsStore";
import { buildNavigationUrl } from "@/utils/url";

export default function NewTabPage() {
  const [query, setQuery] = useState("");
  const { settings } = useSettingsStore();

  const searchEngine = settings?.general?.browser?.searchEngine || "google";

  const handleSearch = useCallback(() => {
    const url = buildNavigationUrl(query, searchEngine);
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
  }, [query, searchEngine]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-4xl font-bold tracking-normal drop-shadow-lg text-gray-800 dark:text-white" style={{ fontFamily: "'Berkshire Swash', cursive" }}>
            DeepFundAI
          </span>
        </div>

        {/* Search box */}
        <div className="w-[500px] relative">
          <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
            className="w-full h-12 pl-12 pr-4 rounded-full border border-gray-600 bg-gray-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        {/* Search engine hint */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {searchEngine.charAt(0).toUpperCase() + searchEngine.slice(1)} Search
        </div>
      </div>
    </div>
  );
}
