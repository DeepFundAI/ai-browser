/**
 * Add MCP Service Modal
 * INPUT: Modal open state and callbacks
 * OUTPUT: New MCP service configuration
 * POSITION: Used by McpPanel to add MCP services
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/** Validate SSE endpoint URL */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface AddMcpServiceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, url: string) => void;
}

/**
 * Modal for adding an MCP service
 */
export const AddMcpServiceModal: React.FC<AddMcpServiceModalProps> = ({
  open,
  onClose,
  onAdd
}) => {
  const { t } = useTranslation('settings');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const isNameValid = name.trim().length > 0;
  const isUrlValid = isValidUrl(url.trim());
  const isFormValid = isNameValid && isUrlValid;

  const showUrlError = useMemo(() => {
    return url.length > 0 && !isUrlValid;
  }, [url, isUrlValid]);

  const handleAdd = () => {
    if (!isFormValid) return;
    onAdd(name.trim(), url.trim());
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setUrl('');
  };

  return (
    <Modal
      title={t('mcp.add_service')}
      open={open}
      onCancel={handleCancel}
      onOk={handleAdd}
      okText={t('mcp.add')}
      cancelText={t('mcp.cancel')}
      okButtonProps={{
        className: 'bg-teal-600 hover:bg-teal-700 border-none disabled:bg-gray-500 disabled:opacity-50',
        disabled: !isFormValid
      }}
      width={480}
    >
      <div className="space-y-4 py-4">
        {/* Service Name */}
        <div>
          <Text className="block mb-2 font-medium">{t('mcp.service_name')}</Text>
          <Input
            placeholder={t('mcp.service_name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            status={name.length > 0 && !isNameValid ? 'error' : undefined}
          />
        </div>

        {/* SSE URL */}
        <div>
          <Text className="block mb-2 font-medium">{t('mcp.sse_url')}</Text>
          <Input
            placeholder={t('mcp.sse_url_placeholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            status={showUrlError ? 'error' : undefined}
          />
          {showUrlError ? (
            <Text className="text-red-400 text-xs block mt-1">
              {t('mcp.invalid_url')}
            </Text>
          ) : (
            <Text className="text-text-12 dark:text-text-12-dark text-xs block mt-1">
              {t('mcp.sse_url_hint')}
            </Text>
          )}
        </div>
      </div>
    </Modal>
  );
};
