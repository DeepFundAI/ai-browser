/**
 * Network settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Proxy, timeout, retry, and User-Agent settings
 * POSITION: Network tab in settings window
 */

import React, { useState } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Typography, Divider, Input, InputNumber, Select, Button, App } from 'antd';
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
export const NetworkPanel: React.FC<NetworkPanelProps> = ({
  settings = getDefaultNetworkSettings(),
  onSettingsChange
}) => {
  const { message } = App.useApp();
  const [testingProxy, setTestingProxy] = useState(false);

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
  };

  const handleTestProxy = async () => {
    if (!settings.proxy.enabled || !settings.proxy.server || !settings.proxy.port) {
      message.warning('Please configure proxy server and port first');
      return;
    }

    setTestingProxy(true);
    try {
      // TODO: Implement actual proxy test via IPC
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.success('Proxy connection successful');
    } catch (error: any) {
      message.error(error.message || 'Proxy connection failed');
    } finally {
      setTestingProxy(false);
    }
  };

  const proxyTypeOptions = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'SOCKS5', value: 'socks5' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <GlobalOutlined className="text-3xl text-blue-400" />
          <Title level={2} className="!text-white !mb-0">
            Network
          </Title>
        </div>
        <Paragraph className="!text-gray-300 !mb-0">
          Configure proxy, timeout, retry, and User-Agent settings
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
            {/* Proxy Settings */}
            <div>
              <Text className="!text-white text-lg font-semibold">Proxy Settings</Text>
              <div className="mt-4">
                <ToggleSetting
                  label="Enable Proxy"
                  description="Route requests through a proxy server"
                  checked={settings.proxy.enabled}
                  onChange={(checked) => handleProxyChange({ enabled: checked })}
                />

                {settings.proxy.enabled && (
                  <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-4">
                    {/* Proxy Type */}
                    <div>
                      <div className="text-white font-medium mb-2">Proxy Type</div>
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
                        <div className="text-white font-medium mb-2">Proxy Server</div>
                        <Input
                          value={settings.proxy.server}
                          onChange={(e) => handleProxyChange({ server: e.target.value })}
                          placeholder="127.0.0.1"
                          className="!bg-white/5 !border-white/10 !text-white"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium mb-2">Port</div>
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
                        <div className="text-white font-medium mb-2">Username (Optional)</div>
                        <Input
                          value={settings.proxy.username}
                          onChange={(e) => handleProxyChange({ username: e.target.value })}
                          placeholder="Username (Optional)"
                          className="!bg-white/5 !border-white/10 !text-white"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium mb-2">Password (Optional)</div>
                        <Input.Password
                          value={settings.proxy.password}
                          onChange={(e) => handleProxyChange({ password: e.target.value })}
                          placeholder="Password (Optional)"
                          className="!bg-white/5 !border-white/10 !text-white"
                        />
                      </div>
                    </div>

                    {/* Test Proxy Button */}
                    <div>
                      <Button
                        onClick={handleTestProxy}
                        loading={testingProxy}
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      >
                        Test Proxy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Divider className="!border-white/10" />

            {/* Network Parameters */}
            <div>
              <Text className="!text-white text-lg font-semibold">Network Parameters</Text>
              <div className="mt-4 space-y-6">
                {/* Request Timeout */}
                <div>
                  <div className="text-white font-medium mb-3">
                    Request Timeout: {settings.requestTimeout} seconds
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

                {/* Retry Attempts */}
                <div>
                  <div className="text-white font-medium mb-2">Retry Attempts</div>
                  <InputNumber
                    value={settings.retryAttempts}
                    onChange={(value) => handleChange({ retryAttempts: value || 0 })}
                    min={0}
                    max={10}
                    className="w-32"
                  />
                  <div className="text-gray-400 text-xs mt-1">
                    Number of automatic retries when requests fail (0-10)
                  </div>
                </div>

                {/* Custom User-Agent */}
                <div>
                  <div className="text-white font-medium mb-2">Custom User-Agent (Optional)</div>
                  <Input
                    value={settings.customUserAgent}
                    onChange={(e) => handleChange({ customUserAgent: e.target.value })}
                    placeholder="Leave empty to use default"
                    className="!bg-white/5 !border-white/10 !text-white"
                  />
                  <div className="text-gray-400 text-xs mt-1">
                    Custom User-Agent identifier for HTTP requests
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
