/**
 * input: Window API for tab operations
 * output: Tab state and control methods
 * pos: Frontend hook for multi-tab browser management
 */

import { useState, useEffect, useCallback } from "react";

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
}

export interface UseTabManagerReturn {
  tabs: TabInfo[];
  activeTabId: number;
  switchTab: (tabId: number) => Promise<void>;
  closeTab: (tabId: number) => Promise<void>;
  createTab: (url?: string) => Promise<number | null>;
}

export const useTabManager = (): UseTabManagerReturn => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<number>(-1);

  useEffect(() => {
    // Initial fetch
    window.api?.tabsGetAll?.().then((res: any) => {
      if (res?.success && res.data) {
        setTabs(res.data.tabs || []);
        setActiveTabId(res.data.activeTabId ?? -1);
      }
    });

    // Listen for changes
    const cleanup = window.api?.onTabsChanged?.((data) => {
      setTabs(data.tabs || []);
      setActiveTabId(data.activeTabId ?? -1);
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const switchTab = useCallback(async (tabId: number) => {
    await window.api?.tabsSwitch?.(tabId);
  }, []);

  const closeTab = useCallback(async (tabId: number) => {
    await window.api?.tabsClose?.(tabId);
  }, []);

  const createTab = useCallback(async (url?: string): Promise<number | null> => {
    const res = await window.api?.tabsCreate?.(url);
    if (res?.success && res.data) {
      return res.data.tabId;
    }
    return null;
  }, []);

  return {
    tabs,
    activeTabId,
    switchTab,
    closeTab,
    createTab,
  };
};
