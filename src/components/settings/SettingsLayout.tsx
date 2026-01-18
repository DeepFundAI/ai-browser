/**
 * Main settings layout component
 * INPUT: useSettingsState hook for unified state management
 * OUTPUT: Settings window with sidebar navigation and content panels
 * POSITION: Root component for settings window
 */

import React, { useState, useEffect } from 'react';
import { Button, App, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
import { getDefaultSettings } from '@/config/settings-defaults';
import { logger } from '@/utils/logger';
import i18n from '@/config/i18n';
import { useLanguageStore } from '@/stores/languageStore';

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
  initialTab = 'general'
}) => {
  const { t } = useTranslation('settings');
  const { modal, message } = App.useApp();

  // Initialize with prop value (consistent for SSR and client)
  const [activeTab, setActiveTabState] = useState<SettingsTab>(initialTab);

  // Wrapper to update both state and URL hash
  const setActiveTab = (tab: SettingsTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  const {
    providers,
    general,
    chat,
    agent,
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
    updateAgent,
    updateUI,
    updateNetwork,
    saveConfigs,
    resetConfigs
  } = useSettingsState();

  // Read URL hash on client mount (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const validTabs: SettingsTab[] = [
        'general', 'providers', 'chat', 'agent', 'scheduled-tasks',
        'user-interface', 'network', 'memory', 'about'
      ];
      if (hash && validTabs.includes(hash as SettingsTab)) {
        logger.debug(`Initial navigation to panel: ${hash}`, 'SettingsLayout');
        setActiveTabState(hash as SettingsTab);
      }
    }
  }, []); // Only run once on mount

  // Listen for URL hash changes to navigate to specific panel
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        const validTabs: SettingsTab[] = [
          'general',
          'providers',
          'chat',
          'agent',
          'scheduled-tasks',
          'user-interface',
          'network',
          'memory',
          'about'
        ];
        if (validTabs.includes(hash as SettingsTab)) {
          logger.debug(`Navigating to panel: ${hash}`, 'SettingsLayout');
          setActiveTabState(hash as SettingsTab);
        }
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  /**
   * Handle save button click
   */
  const handleSave = async () => {
    try {
      // Check if language has changed
      const oldLanguage = i18n.language;
      const newLanguage = general?.language;

      await saveConfigs();
      message.success(t('messages.saved_successfully'));

      // Apply language change if needed
      if (newLanguage && newLanguage !== oldLanguage) {
        await i18n.changeLanguage(newLanguage);
        useLanguageStore.getState().setLanguage(newLanguage);
        logger.info(`Language changed from ${oldLanguage} to ${newLanguage}`, 'SettingsLayout');
      }
    } catch (error: any) {
      message.error(error.message || t('messages.save_failed'));
    }
  };

  /**
   * Handle close button click with unsaved changes confirmation
   */
  const handleClose = () => {
    if (hasChanges) {
      modal.confirm({
        title: t('unsaved_changes_dialog.title'),
        content: t('unsaved_changes_dialog.content'),
        okText: t('unsaved_changes_dialog.save'),
        cancelText: t('unsaved_changes_dialog.discard'),
        onOk: async () => {
          try {
            // Check if language has changed
            const oldLanguage = i18n.language;
            const newLanguage = general?.language;

            await saveConfigs();
            message.success(t('messages.saved_successfully'));

            // Apply language change if needed
            if (newLanguage && newLanguage !== oldLanguage) {
              await i18n.changeLanguage(newLanguage);
              useLanguageStore.getState().setLanguage(newLanguage);
              logger.info(`Language changed from ${oldLanguage} to ${newLanguage}`, 'SettingsLayout');
            }

            closeWindow();
          } catch (error: any) {
            message.error(error.message || t('messages.save_failed'));
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
          title: t('import_dialog.title'),
          content: t('import_dialog.content'),
          okText: t('import_dialog.ok'),
          cancelText: t('import_dialog.cancel'),
          onOk: async () => {
            try {
              // Save imported config
              if (typeof window !== 'undefined' && (window as any).api) {
                await (window as any).api.saveAppSettings(importedConfig);
                message.success(t('messages.imported_successfully'));
                window.location.reload(); // Reload to apply new settings
              }
            } catch (error: any) {
              message.error(error.message || t('messages.import_failed'));
            }
          }
        });
      } catch (error: any) {
        message.error(t('messages.invalid_file_format'));
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
        const response = await (window as any).api.getAppSettings();
        const settings = response?.data || response || {};

        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-browser-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        message.success(t('messages.exported_successfully'));
      }
    } catch (error: any) {
      message.error(error.message || t('messages.export_failed'));
    }
  };

  /**
   * Handle reset settings to defaults
   */
  const handleReset = () => {
    modal.confirm({
      title: t('reset_dialog.title'),
      content: t('reset_dialog.content'),
      okText: t('reset_dialog.ok'),
      okType: 'danger',
      cancelText: t('reset_dialog.cancel'),
      onOk: async () => {
        try {
          if (typeof window !== 'undefined' && (window as any).api) {
            // Get true default settings
            const defaultSettings = getDefaultSettings();

            // Save default settings
            await (window as any).api.saveAppSettings(defaultSettings);
            message.success(t('messages.reset_successfully'));
            window.location.reload(); // Reload to apply default settings
          }
        } catch (error: any) {
          message.error(error.message || t('messages.reset_failed'));
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
        return agent ? (
          <AgentPanel
            settings={agent}
            onSettingsChange={updateAgent}
          />
        ) : null;
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
            <div className="text-center text-text-12 dark:text-text-12-dark">
              <div className="text-6xl mb-4">🧠</div>
              <div className="text-2xl font-semibold mb-2">Memory Settings</div>
              <div className="text-sm">Configure conversation memory and context management</div>
              <div className="text-xs mt-2 text-gray-500 dark:text-gray-500">Coming Soon</div>
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
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 overflow-hidden"
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-8 py-4 bg-gray-100/80 dark:bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Status indicator */}
          <div className="text-sm flex items-center gap-2">
            {hasChanges ? (
              <>
                <motion.span
                  className="inline-block w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-yellow-600 dark:text-yellow-400">{t('unsaved_changes')}</span>
              </>
            ) : (
              <span className="text-text-12 dark:text-text-12-dark">{t('all_changes_saved')}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              className="!bg-transparent !border-gray-300 dark:!border-white/10 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-white/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('close')}
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 border-none disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
