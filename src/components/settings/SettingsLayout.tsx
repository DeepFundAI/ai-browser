import React, { useState } from 'react';
import { Button, Modal, message, Spin } from 'antd';
import { SettingsSidebar } from './SettingsSidebar';
import { ProvidersPanel } from './panels/ProvidersPanel';
import { GeneralPanel } from './panels/GeneralPanel';
import { ChatPanel } from './panels/ChatPanel';
import { AgentPanel } from './panels/AgentPanel';
import { UserInterfacePanel } from './panels/UserInterfacePanel';
import { AboutPanel } from './panels/AboutPanel';
import { useSettingsState } from '@/hooks/useSettingsState';

export type SettingsTab =
  | 'general'
  | 'providers'
  | 'chat'
  | 'agent'
  | 'memory'
  | 'user-interface'
  | 'network'
  | 'keybindings'
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
    configs,
    loading,
    saving,
    hasChanges,
    updateConfigs,
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
    if (loading || !configs) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return <GeneralPanel />;
      case 'providers':
        return (
          <ProvidersPanel
            configs={configs}
            onConfigsChange={updateConfigs}
          />
        );
      case 'chat':
        return <ChatPanel />;
      case 'agent':
        return <AgentPanel />;
      case 'user-interface':
        return <UserInterfacePanel />;
      case 'about':
        return <AboutPanel />;
      case 'memory':
      case 'network':
      case 'keybindings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🚧</div>
              <div className="text-2xl font-semibold mb-2">Coming Soon</div>
              <div className="text-sm">This feature is under development</div>
            </div>
          </div>
        );
      default:
        return (
          <ProvidersPanel
            configs={configs}
            onConfigsChange={updateConfigs}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
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
