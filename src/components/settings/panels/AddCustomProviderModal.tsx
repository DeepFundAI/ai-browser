/**
 * Add Custom Provider Modal
 * INPUT: Modal open state and callbacks
 * OUTPUT: New custom provider configuration
 * POSITION: Used by ProvidersPanel to add custom providers
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Typography } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface AddCustomProviderModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, baseUrl: string, apiKey: string) => void;
}

/**
 * Modal for adding a custom provider
 */
export const AddCustomProviderModal: React.FC<AddCustomProviderModalProps> = ({
  open,
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Validation state
  const isNameValid = name.trim().length > 0;
  const isBaseUrlValid = isValidUrl(baseUrl.trim());
  const isApiKeyValid = apiKey.trim().length > 0;
  const isFormValid = isNameValid && isBaseUrlValid && isApiKeyValid;

  // Show validation error only after user has typed something
  const showBaseUrlError = useMemo(() => {
    return baseUrl.length > 0 && !isBaseUrlValid;
  }, [baseUrl, isBaseUrlValid]);

  const handleAdd = () => {
    if (!isFormValid) return;
    onAdd(name.trim(), baseUrl.trim(), apiKey.trim());

    // Reset form
    setName('');
    setBaseUrl('');
    setApiKey('');
    setShowApiKey(false);
  };

  const handleCancel = () => {
    // Reset form
    setName('');
    setBaseUrl('');
    setApiKey('');
    setShowApiKey(false);
    onClose();
  };

  return (
    <Modal
      title="Add Custom Provider"
      open={open}
      onCancel={handleCancel}
      onOk={handleAdd}
      okText="Add Provider"
      cancelText="Cancel"
      okButtonProps={{
        className: 'bg-teal-600 hover:bg-teal-700 border-none disabled:bg-gray-500 disabled:opacity-50',
        disabled: !isFormValid
      }}
      width={480}
    >
      <div className="space-y-4 py-4">
        {/* Provider Name */}
        <div>
          <Text className="block mb-2 font-medium">Provider Name</Text>
          <Input
            placeholder="e.g., My Local LLM"
            value={name}
            onChange={(e) => setName(e.target.value)}
            status={name.length > 0 && !isNameValid ? 'error' : undefined}
          />
        </div>

        {/* Base URL */}
        <div>
          <Text className="block mb-2 font-medium">Base URL</Text>
          <Input
            placeholder="e.g., http://localhost:8000/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            status={showBaseUrlError ? 'error' : undefined}
          />
          {showBaseUrlError ? (
            <Text className="text-red-400 text-xs block mt-1">
              Please enter a valid URL (http:// or https://)
            </Text>
          ) : (
            <Text className="text-gray-400 text-xs block mt-1">
              The API endpoint URL (OpenAI-compatible format)
            </Text>
          )}
        </div>

        {/* API Key */}
        <div>
          <Text className="block mb-2 font-medium">API Key</Text>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
