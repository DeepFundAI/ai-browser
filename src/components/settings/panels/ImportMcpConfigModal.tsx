/**
 * INPUT: Modal open state, existing service URLs for dedup
 * OUTPUT: Parsed MCP services from pasted JSON
 * POSITION: Used by McpPanel for batch JSON import
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Typography, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ParsedService {
  name: string;
  url: string;
  type?: 'sse' | 'http';
  headers?: Record<string, string>;
  isDuplicate: boolean;
}

interface ParseResult {
  services: ParsedService[];
  error?: string;
}

/** Parse standard mcpServers JSON config */
function parseMcpJson(json: string, existingUrls: Set<string>): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { services: [], error: 'invalid_json' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { services: [], error: 'invalid_json' };
  }

  const obj = parsed as Record<string, unknown>;
  const servers = obj.mcpServers as Record<string, unknown> | undefined;
  if (!servers || typeof servers !== 'object') {
    return { services: [], error: 'no_servers' };
  }

  const services: ParsedService[] = [];
  for (const [name, config] of Object.entries(servers)) {
    if (!config || typeof config !== 'object') continue;
    const entry = config as Record<string, unknown>;
    const url = entry.url as string | undefined;
    if (!url || typeof url !== 'string') continue;

    const rawType = entry.type as string | undefined;
    const type = (rawType === 'http' || rawType === 'sse') ? rawType as 'sse' | 'http' : undefined;

    const headers = entry.headers as Record<string, string> | undefined;
    const validHeaders = headers && typeof headers === 'object'
      ? Object.fromEntries(Object.entries(headers).filter(([k, v]) => typeof k === 'string' && typeof v === 'string'))
      : undefined;

    services.push({
      name,
      url: url.trim(),
      type,
      headers: validHeaders && Object.keys(validHeaders).length > 0 ? validHeaders : undefined,
      isDuplicate: existingUrls.has(url.trim()),
    });
  }

  return { services };
}

interface ImportMcpConfigModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (services: Array<{ name: string; url: string; type?: 'sse' | 'http'; headers?: Record<string, string> }>) => void;
  existingUrls: string[];
}

/** Modal for importing MCP config via JSON paste */
export const ImportMcpConfigModal: React.FC<ImportMcpConfigModalProps> = ({
  open, onClose, onImport, existingUrls,
}) => {
  const { t } = useTranslation('settings');
  const [jsonText, setJsonText] = useState('');
  const existingUrlSet = useMemo(() => new Set(existingUrls), [existingUrls]);

  const { services, error } = useMemo(
    () => jsonText.trim() ? parseMcpJson(jsonText, existingUrlSet) : { services: [], error: undefined },
    [jsonText, existingUrlSet]
  );

  const newServices = services.filter(s => !s.isDuplicate);
  const canImport = newServices.length > 0 && !error;

  const handleImport = () => {
    if (!canImport) return;
    onImport(newServices.map(({ name, url, type, headers }) => ({ name, url, type, headers })));
    setJsonText('');
    onClose();
  };

  const handleCancel = () => {
    setJsonText('');
    onClose();
  };

  const getErrorMessage = (): string | undefined => {
    if (!jsonText.trim()) return undefined;
    if (error === 'invalid_json') return t('mcp.import_parse_error');
    if (error === 'no_servers') return t('mcp.import_no_servers');
    if (services.length > 0 && newServices.length === 0) return t('mcp.import_no_new');
    return undefined;
  };

  const errorMessage = getErrorMessage();

  return (
    <Modal
      title={t('mcp.import_title')}
      open={open}
      onCancel={handleCancel}
      onOk={handleImport}
      okText={t('mcp.import_config')}
      cancelText={t('mcp.cancel')}
      okButtonProps={{
        className: 'bg-teal-600 hover:bg-teal-700 border-none disabled:bg-gray-500 disabled:opacity-50',
        disabled: !canImport,
      }}
      width={560}
    >
      <div className="space-y-4 py-4">
        <Text className="!text-text-12 dark:!text-text-12-dark text-sm block">
          {t('mcp.import_paste_hint')}
        </Text>

        <Input.TextArea
          rows={8}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={t('mcp.import_placeholder')}
          className="font-mono text-xs"
          status={errorMessage ? 'error' : undefined}
        />

        {errorMessage && (
          <Text className="text-red-400 text-xs block">{errorMessage}</Text>
        )}

        {/* Preview list */}
        {services.length > 0 && !error && (
          <div>
            <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
              {t('mcp.import_preview')}
            </Text>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {services.map((service, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                    service.isDuplicate
                      ? 'bg-gray-100 dark:bg-white/5 opacity-50 line-through'
                      : 'bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  <span className="font-medium truncate flex-shrink-0">{service.name}</span>
                  <span className="text-text-12 dark:text-text-12-dark truncate flex-1 text-xs">{service.url}</span>
                  {service.headers && (
                    <Tag className="flex-shrink-0">{Object.keys(service.headers).length} headers</Tag>
                  )}
                  {service.isDuplicate && (
                    <Tag color="orange" className="flex-shrink-0">{t('mcp.import_duplicate')}</Tag>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
