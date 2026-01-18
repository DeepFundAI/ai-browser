/**
 * Token usage display component
 * INPUT: Usage data from AgentGroupMessage
 * OUTPUT: Formatted token statistics
 * POSITION: Displayed at bottom of agent group messages
 */

import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

interface TokenUsageDisplayProps {
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ usage }) => {
  const { settings } = useSettingsStore();

  // Display based on configuration
  if (!settings?.chat?.showTokenUsage || !usage) {
    return null;
  }

  return (
    <div className="mt-2 text-xs text-text-12 dark:text-text-12-dark flex items-center gap-2">
      <span className="opacity-60">Tokens:</span>
      <span>{usage.totalTokens.toLocaleString()}</span>
      <span className="opacity-40">
        ({usage.promptTokens.toLocaleString()} in + {usage.completionTokens.toLocaleString()} out)
      </span>
    </div>
  );
};
