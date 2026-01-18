import React from 'react';
import { DeepThinking } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';

// Safely render node text
const renderNodeText = (node: any, t: any): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'object' && node !== null) {
    if (node.text && typeof node.text === 'string') {
      return node.text;
    }
    // If no text property or empty, return default text
    return t('step_description');
  }
  return String(node || t('step_description'));
};

interface StepNodeDisplayProps {
  node: any;
  nodeIndex: number;
  t: any;
}

/**
 * Step Node Display Component
 * Renders a single step in the agent execution flow
 */
const StepNodeDisplay: React.FC<StepNodeDisplayProps> = ({
  node,
  nodeIndex,
  t
}) => {
  // Data-driven: nodeText is already complete from data
  const displayText = renderNodeText(node, t);

  return (
    <div className="step-item flex items-center justify-start gap-2 mt-3">
      <span className="font-semibold w-5 h-5 bg-step dark:bg-step-dark rounded-full flex items-center justify-center">
        {nodeIndex + 1}
      </span>
      <span className='line-clamp-1 flex-1'>
        {displayText}
      </span>
    </div>
  );
};

interface StepAgentDisplayProps {
  agent: any;
}

/**
 * Step Agent Display Component
 * Shows agent execution in STEP format with task and execution nodes
 */
export const StepAgentDisplay: React.FC<StepAgentDisplayProps> = ({
  agent
}) => {
  const { t } = useTranslation('chat');

  // Data-driven: agent.task is already streaming from PlaybackEngine
  const displayTask = agent.task;

  return (
    <div className="step-agent-display text-base">
      {/* Agent information - status display removed */}
      <div className="px-2 border-l-2 border-text-05-dark mb-3">
        <div className="flex items-center gap-1 text-text-05 dark:text-text-05-dark font-semibold ">
          <DeepThinking />
          {agent.name} {t('agent')}
        </div>
        <div className="mt-1">
          {displayTask}
        </div>
      </div>

      {/* Execution steps - STEP format */}
      {agent.nodes && agent.nodes.length > 0 && (
        <div className="space-y-2">
          {agent.nodes.map((node: any, nodeIndex: number) => (
            <StepNodeDisplay
              key={nodeIndex}
              node={node}
              nodeIndex={nodeIndex}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};
