/**
 * INPUT: headers Record from McpServiceConfig
 * OUTPUT: key-value editor for HTTP headers
 * POSITION: Sub-component used in McpPanel service detail
 */

import React, { useState, useEffect } from 'react';
import { Input, Button } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const inputClass = '!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark';

interface McpHeadersEditorProps {
  headers?: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

type HeaderEntry = { id: string; key: string; value: string };

/** Convert Record to array entries */
function toEntries(headers?: Record<string, string>): HeaderEntry[] {
  if (!headers) return [];
  return Object.entries(headers).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

/** Convert array entries to Record (skip empty keys) */
function toRecord(entries: HeaderEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of entries) {
    if (key.trim()) result[key.trim()] = value;
  }
  return result;
}

/** Key-value editor for MCP service headers */
export const McpHeadersEditor: React.FC<McpHeadersEditorProps> = ({ headers = {}, onChange }) => {
  const { t } = useTranslation('settings');
  const [entries, setEntries] = useState<HeaderEntry[]>(() => toEntries(headers));

  useEffect(() => {
    setEntries(toEntries(headers));
  }, [headers]);

  const emitChange = (updated: HeaderEntry[]) => {
    setEntries(updated);
    onChange(toRecord(updated));
  };

  const handleKeyChange = (id: string, newKey: string) => {
    emitChange(entries.map(e => e.id === id ? { ...e, key: newKey } : e));
  };

  const handleValueChange = (id: string, value: string) => {
    emitChange(entries.map(e => e.id === id ? { ...e, value } : e));
  };

  const handleDelete = (id: string) => {
    emitChange(entries.filter(e => e.id !== id));
  };

  const handleAdd = () => {
    const newEntry: HeaderEntry = { id: crypto.randomUUID(), key: '', value: '' };
    setEntries([...entries, newEntry]);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          <Input
            value={entry.key}
            onChange={(e) => handleKeyChange(entry.id, e.target.value)}
            placeholder={t('mcp.header_key_placeholder')}
            className={`flex-1 ${inputClass}`}
          />
          <Input.Password
            value={entry.value}
            onChange={(e) => handleValueChange(entry.id, e.target.value)}
            placeholder={t('mcp.header_value_placeholder')}
            className={`flex-[2] ${inputClass}`}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(entry.id)}
            className="!text-red-400 hover:!text-red-500 flex-shrink-0"
          />
        </div>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        className="w-full !border-black/10 dark:!border-white/10"
      >
        {t('mcp.add_header')}
      </Button>
    </div>
  );
};
