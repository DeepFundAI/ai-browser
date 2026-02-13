/**
 * input: BrowserWindow, bounds config, createView function
 * output: ITabManager interface for multi-tab management
 * pos: Core service managing multiple WebContentsView as browser tabs
 */

import { BrowserWindow, WebContentsView } from "electron";
import { createView } from "../ui/view";

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
}

export interface ITabManager {
  // Query
  getAllTabs(): TabInfo[];
  getActiveView(): WebContentsView | null;
  getActiveTabId(): number;

  // Mutations
  createTab(url?: string): number;
  switchTab(tabId: number): boolean;
  closeTab(tabId: number): boolean;
  navigateTo(url: string): Promise<void>;

  // Lifecycle
  cleanupAllExceptLast(): void;
  destroyAll(): void;

  // Visibility
  setVisible(visible: boolean): void;
}

interface TabEntry {
  tabId: number;
  view: WebContentsView;
}

interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TabManager implements ITabManager {
  private tabs: Map<number, TabEntry> = new Map();
  private activeTabId: number = -1;
  private nextTabId: number = 0;
  private mainWindow: BrowserWindow;
  private bounds: TabBounds;
  private isVisible: boolean = false;

  constructor(mainWindow: BrowserWindow, bounds: TabBounds) {
    this.mainWindow = mainWindow;
    this.bounds = bounds;
  }

  /**
   * Create new tab with optional URL
   */
  createTab(url: string = "about:blank"): number {
    const tabId = this.nextTabId++;
    const view = createView(url, "view", String(tabId));

    // Intercept window.open -> create new tab
    view.webContents.setWindowOpenHandler(({ url: openUrl }) => {
      this.createTab(openUrl);
      return { action: "deny" };
    });

    // Setup navigation listeners
    view.webContents.on("did-navigate", () => this.notifyTabsChanged());
    view.webContents.on("did-navigate-in-page", () => this.notifyTabsChanged());
    view.webContents.on("page-title-updated", () => this.notifyTabsChanged());

    // Notify URL changes to frontend
    const handleUrlChange = (_event: any, changedUrl: string) => {
      if (tabId === this.activeTabId) {
        this.mainWindow?.webContents.send("url-changed", changedUrl);
      }
    };
    view.webContents.on("did-navigate", handleUrlChange);
    view.webContents.on("did-navigate-in-page", handleUrlChange);

    // Add to window
    this.mainWindow.contentView.addChildView(view);
    view.setBounds(this.bounds);
    view.setVisible(false);

    this.tabs.set(tabId, { tabId, view });

    // Switch to new tab
    this.switchTab(tabId);

    console.log(`[TabManager] Created tab ${tabId}, url: ${url}`);
    return tabId;
  }

  /**
   * Switch to specified tab
   */
  switchTab(tabId: number): boolean {
    if (!this.tabs.has(tabId)) {
      console.warn(`[TabManager] Tab ${tabId} not found`);
      return false;
    }

    // Hide current active tab
    const current = this.tabs.get(this.activeTabId);
    if (current) {
      current.view.setVisible(false);
    }

    // Show target tab
    const target = this.tabs.get(tabId)!;
    target.view.setVisible(this.isVisible);

    this.activeTabId = tabId;
    this.notifyTabsChanged();

    // Notify URL change for new active tab
    const url = target.view.webContents.getURL();
    this.mainWindow?.webContents.send("url-changed", url);

    console.log(`[TabManager] Switched to tab ${tabId}`);
    return true;
  }

  /**
   * Close specified tab (keeps at least one)
   */
  closeTab(tabId: number): boolean {
    if (this.tabs.size <= 1) {
      console.warn("[TabManager] Cannot close last tab");
      return false;
    }

    const entry = this.tabs.get(tabId);
    if (!entry) {
      console.warn(`[TabManager] Tab ${tabId} not found`);
      return false;
    }

    // Remove from window and destroy
    this.mainWindow.contentView.removeChildView(entry.view);
    entry.view.webContents.close();
    this.tabs.delete(tabId);

    // Switch to another tab if closing active
    if (tabId === this.activeTabId) {
      const remaining = Array.from(this.tabs.keys());
      this.switchTab(remaining[remaining.length - 1]);
    }

    this.notifyTabsChanged();
    console.log(`[TabManager] Closed tab ${tabId}`);
    return true;
  }

  /**
   * Navigate active tab to URL
   */
  async navigateTo(url: string): Promise<void> {
    const view = this.getActiveView();
    if (!view) {
      console.warn("[TabManager] No active view for navigation");
      return;
    }
    try {
      await view.webContents.loadURL(url);
    } catch (error) {
      console.error("[TabManager] Navigation failed:", url, error);
    }
  }

  /**
   * Get all tab info
   */
  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values()).map(({ tabId, view }) => ({
      tabId,
      url: view.webContents.getURL(),
      title: view.webContents.getTitle() || "New Tab",
    }));
  }

  /**
   * Get active WebContentsView
   */
  getActiveView(): WebContentsView | null {
    const entry = this.tabs.get(this.activeTabId);
    return entry?.view ?? null;
  }

  /**
   * Get active tab ID
   */
  getActiveTabId(): number {
    return this.activeTabId;
  }

  /**
   * Set visibility for active tab
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.setVisible(visible);
    }
  }

  /**
   * Update bounds for all tabs
   */
  setBounds(bounds: TabBounds): void {
    this.bounds = bounds;
    for (const { view } of this.tabs.values()) {
      view.setBounds(bounds);
    }
  }

  /**
   * Cleanup all tabs except the last opened one
   */
  cleanupAllExceptLast(): void {
    if (this.tabs.size <= 1) return;

    const tabIds = Array.from(this.tabs.keys());
    const lastTabId = tabIds[tabIds.length - 1];

    for (const tabId of tabIds) {
      if (tabId !== lastTabId) {
        const entry = this.tabs.get(tabId);
        if (entry) {
          this.mainWindow.contentView.removeChildView(entry.view);
          entry.view.webContents.close();
          this.tabs.delete(tabId);
        }
      }
    }

    this.switchTab(lastTabId);
    this.notifyTabsChanged();
    console.log(`[TabManager] Cleanup complete, kept tab ${lastTabId}`);
  }

  /**
   * Destroy all tabs
   */
  destroyAll(): void {
    for (const { view } of this.tabs.values()) {
      try {
        this.mainWindow.contentView.removeChildView(view);
        view.webContents.close();
      } catch (error) {
        console.error("[TabManager] Error destroying view:", error);
      }
    }
    this.tabs.clear();
    this.activeTabId = -1;
    console.log("[TabManager] All tabs destroyed");
  }

  /**
   * Notify frontend about tab changes
   */
  private notifyTabsChanged(): void {
    if (this.mainWindow?.isDestroyed()) return;

    this.mainWindow.webContents.send("tabs-changed", {
      tabs: this.getAllTabs(),
      activeTabId: this.activeTabId,
    });
  }
}
