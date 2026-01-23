/**
 * Network settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Proxy, timeout, retry, and User-Agent settings
 * POSITION: Network tab in settings window
 */

import React, { useState } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Typography, Divider, Input, InputNumber, Select, Button, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { ToggleSetting, SliderSetting } from '../components';
import { NetworkSettings } from '@/models/settings';
import { getDefaultNetworkSettings } from '@/config/settings-defaults';

const { Title, Paragraph, Text } = Typography;

interface NetworkPanelProps {
  settings?: NetworkSettings;
  onSettingsChange?: (settings: NetworkSettings) => void;
}

/**
 * Network configuration panel
 */
type ProxyTestStatus = 'untested' | 'testing' | 'success' | 'failed';

export const NetworkPanel: React.FC<NetworkPanelProps> = ({
  settings = getDefaultNetworkSettings(),
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [testingProxy, setTestingProxy] = useState(false);
  const [proxyTestStatus, setProxyTestStatus] = useState<ProxyTestStatus>('untested');

  const handleChange = (updates: Partial<NetworkSettings>) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, ...updates });
    }
  };

  const handleProxyChange = (updates: Partial<NetworkSettings['proxy']>) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        proxy: { ...settings.proxy, ...updates }
      });
    }
    // Reset test status when proxy config changes
    setProxyTestStatus('untested');
  };

  const handleTestProxy = async () => {
    if (!settings.proxy.server || !settings.proxy.port) {
      message.warning(t('network.test_proxy_warning'));
      return;
    }

    setTestingProxy(true);
    setProxyTestStatus('testing');
    try {
      // Pass current proxy settings from UI inputs to backend for testing
      const result = await window.api.invoke('settings:testProxy', {
        type: settings.proxy.type,
        server: settings.proxy.server,
        port: settings.proxy.port,
        username: settings.proxy.username,
        password: settings.proxy.password
      });

      if (result.success) {
        setProxyTestStatus('success');
        message.success(result.message || t('network.test_proxy_success'));
      } else {
        setProxyTestStatus('failed');
        message.error(result.error || t('network.test_proxy_failed'));
      }
    } catch (error: any) {
      setProxyTestStatus('failed');
      message.error(error.message || t('network.test_proxy_failed'));
    } finally {
      setTestingProxy(false);
    }
  };

  const proxyTypeOptions = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'SOCKS5', value: 'socks5' }
  ];

  // Render proxy test status indicator
  const renderProxyStatus = () => {
    const statusConfig = {
      untested: { color: '#f59e0b', text: t('network.proxy_status_untested') },
      testing: { color: '#3b82f6', text: t('network.proxy_status_testing') },
      success: { color: '#10b981', text: t('network.proxy_status_success') },
      failed: { color: '#ef4444', text: t('network.proxy_status_failed') }
    };

    const { color, text } = statusConfig[proxyTestStatus];

    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="!text-text-12 dark:!text-text-12-dark text-sm">{text}</Text>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <GlobalOutlined className="text-3xl text-primary dark:text-purple-400" />
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('network.title')}
          </Title>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('network.description')}
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white dark:!bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:!border-white/5 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
            {/* Proxy Settings */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('network.proxy_settings')}</Text>
              <div className="mt-4">
                <ToggleSetting
                  label={t('network.enable_proxy')}
                  description={t('network.enable_proxy_desc')}
                  checked={settings.proxy.enabled}
                  onChange={(checked) => handleProxyChange({ enabled: checked })}
                />

                {settings.proxy.enabled && (
                  <div className="mt-6 p-6 bg-white dark:!bg-white/5 rounded-lg border border-gray-200 dark:!border-white/5 space-y-4">
                    {/* Proxy Type */}
                    <div>
                      <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.proxy_type')}</div>
                      <Select
                        value={settings.proxy.type}
                        onChange={(value) => handleProxyChange({ type: value })}
                        options={proxyTypeOptions}
                        className="w-full"
                      />
                    </div>

                    {/* Proxy Server and Port */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.proxy_server')}</div>
                        <Input
                          value={settings.proxy.server}
                          onChange={(e) => handleProxyChange({ server: e.target.value })}
                          placeholder="127.0.0.1"
                          className="!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark"
                        />
                      </div>
                      <div>
                        <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.port')}</div>
                        <InputNumber
                          value={settings.proxy.port}
                          onChange={(value) => handleProxyChange({ port: value || 8080 })}
                          min={1}
                          max={65535}
                          placeholder="8080"
                          className="!w-full"
                        />
                      </div>
                    </div>

                    {/* Username and Password (Optional) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.username_optional')}</div>
                        <Input
                          value={settings.proxy.username}
                          onChange={(e) => handleProxyChange({ username: e.target.value })}
                          placeholder={t('network.username_optional')}
                          className="!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark"
                        />
                      </div>
                      <div>
                        <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.password_optional')}</div>
                        <Input.Password
                          value={settings.proxy.password}
                          onChange={(e) => handleProxyChange({ password: e.target.value })}
                          placeholder={t('network.password_optional')}
                          className="!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark"
                        />
                      </div>
                    </div>

                    {/* Test Proxy Button and Status */}
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={handleTestProxy}
                        loading={testingProxy}
                        className="!bg-white dark:!bg-white/10 !border-black/5 dark:!border-white/5 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-white/20 hover:!border-primary/30 cursor-pointer transition-all duration-200"
                      >
                        {t('network.test_proxy')}
                      </Button>
                      {renderProxyStatus()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Divider className="!border-black/5 dark:!border-white/5" />

            {/* Network Parameters */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('network.network_parameters')}</Text>
              <div className="mt-4 space-y-6">
                {/* Request Timeout */}
                <div>
                  <div className="text-text-01 dark:!text-text-01-dark font-medium mb-1">
                    {t('network.request_timeout')}: {settings.requestTimeout} {t('network.request_timeout_unit')}
                  </div>
                  <div className="text-gray-400 text-xs mb-2">
                    {t('network.request_timeout_desc')}
                  </div>
                  <div className="px-1">
                    <SliderSetting
                      label=""
                      description=""
                      value={settings.requestTimeout}
                      min={5}
                      max={120}
                      step={1}
                      onChange={(value) => handleChange({ requestTimeout: value })}
                      marks={{
                        5: '5s',
                        60: '60s',
                        120: '120s'
                      }}
                    />
                  </div>
                </div>

                {/* Stream Timeout */}
                <div>
                  <div className="text-text-01 dark:!text-text-01-dark font-medium mb-1">
                    {t('network.stream_timeout')}: {settings.streamTimeout} {t('network.request_timeout_unit')}
                  </div>
                  <div className="text-gray-400 text-xs mb-2">
                    {t('network.stream_timeout_desc')}
                  </div>
                  <div className="px-1">
                    <SliderSetting
                      label=""
                      description=""
                      value={settings.streamTimeout}
                      min={60}
                      max={300}
                      step={10}
                      onChange={(value) => handleChange({ streamTimeout: value })}
                      marks={{
                        60: '60s',
                        180: '180s',
                        300: '300s'
                      }}
                    />
                  </div>
                </div>

                {/* Retry Attempts */}
                <div>
                  <div className="text-text-01 dark:!text-text-01-dark font-medium mb-2">{t('network.retry_attempts')}</div>
                  <InputNumber
                    value={settings.retryAttempts}
                    onChange={(value) => handleChange({ retryAttempts: value || 0 })}
                    min={0}
                    max={10}
                    className="w-32"
                  />
                  <div className="text-gray-400 text-xs mt-1">
                    {t('network.retry_attempts_desc')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
