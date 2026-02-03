/**
 * input: tabs array, activeTabId, event handlers
 * output: Tab bar UI for multi-tab browser
 * pos: Child component of DetailPanel for tab switching
 */

import React from "react";
import { CloseOutlined } from "@ant-design/icons";
import type { TabInfo } from "@/hooks/useTabManager";

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: number;
  onTabClick: (tabId: number) => void;
  onTabClose: (tabId: number) => void;
}

/**
 * Tab bar for browser multi-tab support
 */
export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}) => {
  // Hide when only one tab
  if (tabs.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-border-message-dark overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.tabId === activeTabId;

        return (
          <div
            key={tab.tabId}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer group
              min-w-[80px] max-w-[180px] transition-colors
              ${isActive
                ? "bg-white dark:bg-gray-900 border-t border-l border-r border-gray-200 dark:border-border-message-dark -mb-[1px]"
                : "bg-gray-200/60 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
            onClick={() => onTabClick(tab.tabId)}
          >
            <span className="text-xs truncate flex-1 text-text-01 dark:text-text-01-dark">
              {tab.title || "New Tab"}
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.tabId);
              }}
            >
              <CloseOutlined className="text-[10px] text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
