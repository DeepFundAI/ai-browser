/**
 * Main settings layout component
 * INPUT: useSettingsState hook for unified state management
 * OUTPUT: Settings window with sidebar navigation and content panels
 * POSITION: Root component for settings window
 */

import React, { useState } from 'react';
import { Button, App, Spin } from 'antd';
import { SettingsSidebar } from './SettingsSidebar';
import { ProvidersPanel } from './panels/ProvidersPanel';
import { GeneralPanel } from './panels/GeneralPanel';
import { ChatPanel } from './panels/ChatPanel';
import { AgentPanel } from './panels/AgentPanel';
import { ScheduledTasksPanel } from './panels/ScheduledTasksPanel';
import { UserInterfacePanel } from './panels/UserInterfacePanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { AboutPanel } from './panels/AboutPanel';
import { useSettingsState } from '@/hooks/useSettingsState';
import { convertLegacyToNewConfig, convertNewToLegacyConfig } from '@/utils/config-converter';

export type SettingsTab =
  | 'general'
  | 'providers'
  | 'chat'
  | 'agent'
  | 'scheduled-tasks'
  | 'user-interface'
  | 'network'
  | 'memory'
  | 'about';

interface SettingsLayoutProps {
  initialTab?: SettingsTab;
}

/**
 * Main settings layout component with sidebar navigation and content panels
 * Manages unified state and save/close functionality for all settings
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  initialTab = 'providers'
}) => {
  const { modal, message } = App.useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const {
    providers,
    general,
    chat,
    ui,
    network,
    loading,
    saving,
    hasChanges,
    updateProviders,
    addProvider,
    removeProvider,
    updateGeneral,
    updateChat,
    updateUI,
    updateNetwork,
    saveConfigs,
    resetConfigs
  } = useSettingsState();

  /**
   * Handle save button click
   */
  const handleSave = async () => {
    try {
      await saveConfigs();
      message.success('Settings saved successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to save settings');
    }
  };

  /**
   * Handle close button click with unsaved changes confirmation
   */
  const handleClose = () => {
    if (hasChanges) {
      modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to save before closing?',
        okText: 'Save',
        cancelText: 'Discard',
        onOk: async () => {
          try {
            await saveConfigs();
            message.success('Settings saved successfully');
            closeWindow();
          } catch (error: any) {
            message.error(error.message || 'Failed to save settings');
          }
        },
        onCancel: () => {
          resetConfigs();
          closeWindow();
        }
      });
    } else {
      closeWindow();
    }
  };

  /**
   * Close settings window
   */
  const closeWindow = () => {
    if (typeof window !== 'undefined' && (window as any).api) {
      (window as any).api.closeSettings();
    }
  };

  /**
   * Handle import settings
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);

        modal.confirm({
          title: 'Import Settings',
          content: 'This will replace all your current settings. Are you sure?',
          okText: 'Import',
          cancelText: 'Cancel',
          onOk: async () => {
            try {
              // Save imported config
              if (typeof window !== 'undefined' && (window as any).api) {
                await (window as any).api.saveUserModelConfigs(importedConfig);
                message.success('Settings imported successfully');
                window.location.reload(); // Reload to apply new settings
              }
            } catch (error: any) {
              message.error(error.message || 'Failed to import settings');
            }
          }
        });
      } catch (error: any) {
        message.error('Invalid settings file format');
      }
    };
    input.click();
  };

  /**
   * Handle export settings
   */
  const handleExport = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        const response = await (window as any).api.getUserModelConfigs();
        const configs = response?.data?.configs || response || {};

        const dataStr = JSON.stringify(configs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-browser-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        message.success('Settings exported successfully');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to export settings');
    }
  };

  /**
   * Handle reset settings
   */
  const handleReset = () => {
    modal.confirm({
      title: 'Reset Settings',
      content: 'This will reset all settings to their default values. This action cannot be undone. Are you sure?',
      okText: 'Reset',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (typeof window !== 'undefined' && (window as any).api) {
            // Save default settings by creating new configs with defaults
            const defaultConfigs = convertLegacyToNewConfig({});
            const legacyConfigs = convertNewToLegacyConfig(defaultConfigs);
            await (window as any).api.saveUserModelConfigs(legacyConfigs);
            message.success('Settings reset to defaults');
            window.location.reload(); // Reload to apply default settings
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to reset settings');
        }
      }
    });
  };

  /**
   * Render the active panel based on selected tab
   */
  const renderPanel = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return general ? (
          <GeneralPanel
            settings={general}
            onSettingsChange={updateGeneral}
            providers={providers}
          />
        ) : null;
      case 'providers':
        return providers ? (
          <ProvidersPanel
            configs={providers}
            onConfigsChange={updateProviders}
            onAddProvider={addProvider}
            onRemoveProvider={removeProvider}
          />
        ) : null;
      case 'chat':
        return chat ? (
          <ChatPanel
            settings={chat}
            onSettingsChange={updateChat}
          />
        ) : null;
      case 'agent':
        return <AgentPanel />;
      case 'scheduled-tasks':
        return <ScheduledTasksPanel />;
      case 'user-interface':
        return ui ? (
          <UserInterfacePanel
            settings={ui}
            onSettingsChange={updateUI}
          />
        ) : null;
      case 'network':
        return network ? (
          <NetworkPanel
            settings={network}
            onSettingsChange={updateNetwork}
          />
        ) : null;
      case 'memory':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🧠</div>
              <div className="text-2xl font-semibold mb-2">Memory Settings</div>
              <div className="text-sm">Configure conversation memory and context management</div>
              <div className="text-xs mt-2 text-gray-500">Coming Soon</div>
            </div>
          </div>
        );
      case 'about':
        return <AboutPanel />;
      default:
        return providers ? (
          <ProvidersPanel
            configs={providers}
            onConfigsChange={updateProviders}
            onAddProvider={addProvider}
            onRemoveProvider={removeProvider}
          />
        ) : null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onImport={handleImport}
          onExport={handleExport}
          onReset={handleReset}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {renderPanel()}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-white/10 px-8 py-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Status indicator */}
          <div className="text-sm">
            {hasChanges ? (
              <span className="text-yellow-400">● Unsaved changes</span>
            ) : (
              <span className="text-gray-400">All changes saved</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5"
            >
              Close
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 border-none disabled:bg-gray-600"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
