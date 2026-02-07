/**
 * input: currentUrl, searchEngine settings, onNavigate callback
 * output: Editable address bar with URL/search detection
 * pos: Child component of DetailPanel for navigation
 */

import React, { useState, useCallback, useEffect, KeyboardEvent } from "react";
import { ReloadOutlined, GlobalOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { SearchEngine } from "@/models/settings";
import { buildNavigationUrl, getHostname } from "@/utils/url";

interface AddressBarProps {
  currentUrl: string;
  searchEngine: SearchEngine;
  onNavigate: (url: string) => void;
  onRefresh?: () => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

/**
 * Favicon component with error handling
 */
const AddressFavicon: React.FC<{ url: string }> = ({ url }) => {
  const [hasError, setHasError] = useState(false);
  const hostname = getHostname(url);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const handleError = useCallback(() => setHasError(true), []);

  if (!hostname || hasError) {
    return <GlobalOutlined className="text-sm text-gray-400 flex-shrink-0" />;
  }

  return (
    <img
      src={`https://${hostname}/favicon.ico`}
      className="w-4 h-4 flex-shrink-0"
      onError={handleError}
      alt=""
    />
  );
};

/**
 * Editable address bar component
 */
export const AddressBar: React.FC<AddressBarProps> = ({
  currentUrl,
  searchEngine,
  onNavigate,
  onRefresh,
  onGoBack,
  onGoForward,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl || "");
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external URL changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(currentUrl || "");
    }
  }, [currentUrl, isFocused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const url = buildNavigationUrl(inputValue, searchEngine);
      if (url) {
        onNavigate(url);
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => {
    setIsFocused(false);
    setInputValue(currentUrl || "");
  };

  return (
    <div className="h-[42px] min-h-[42px] bg-gray-50 dark:bg-tool-call-dark flex items-center gap-1 px-2 border-b border-gray-200 dark:border-border-message-dark">
      {/* Navigation buttons */}
      <button
        type="button"
        onClick={() => onGoBack?.()}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <LeftOutlined className="text-sm text-gray-500 dark:text-gray-400" />
      </button>
      <button
        type="button"
        onClick={() => onGoForward?.()}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <RightOutlined className="text-sm text-gray-500 dark:text-gray-400" />
      </button>
      <button
        type="button"
        onClick={() => onRefresh?.()}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <ReloadOutlined className="text-sm text-gray-500 dark:text-gray-400" />
      </button>

      {/* URL input */}
      <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 ml-1">
        <AddressFavicon url={currentUrl || ""} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter URL or search term..."
          className="flex-1 bg-transparent text-xs text-text-01 dark:text-text-01-dark focus:outline-none"
        />
      </div>
    </div>
  );
};
