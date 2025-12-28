/**
 * Main settings layout component
 * INPUT: useSettingsState hook for unified state management
 * OUTPUT: Settings window with sidebar navigation and content panels
 * POSITION: Root component for settings window
 */

import React, { useState } from 'react';
import { Button, Modal, message, Spin } from 'antd';
import { SettingsSidebar } from './SettingsSidebar';
import { ProvidersPanel } from './panels/ProvidersPanel';
import { GeneralPanel } from './panels/GeneralPanel';
import { ChatPanel } from './panels/ChatPanel';
import { AgentPanel } from './panels/AgentPanel';
import { ScheduledTasksPanel } from './panels/ScheduledTasksPanel';
import { UserInterfacePanel } from './panels/UserInterfacePanel';
import { AboutPanel } from './panels/AboutPanel';
import { useSettingsState } from '@/hooks/useSettingsState';

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const {
    providers,
    general,
    chat,
    ui,
    loading,
    saving,
    hasChanges,
    updateProviders,
    addProvider,
    removeProvider,
    updateGeneral,
    updateChat,
    updateUI,
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
      Modal.confirm({
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
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🌐</div>
              <div className="text-2xl font-semibold mb-2">Network Settings</div>
              <div className="text-sm">Proxy, timeout, retry, and User-Agent configuration</div>
              <div className="text-xs mt-2 text-gray-500">Coming Soon</div>
            </div>
          </div>
        );
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
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

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
