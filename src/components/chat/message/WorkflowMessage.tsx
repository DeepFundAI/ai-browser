import React from 'react';
import { Atlas } from '@/icons/deepfundai-icons';
import { ThinkingDisplay } from './ThinkingMessage';
import { StepAgentDisplay } from './AgentMessage';

interface WorkflowDisplayProps {
  workflow: any;
}

/**
 * Workflow Display Component
 * Shows the complete workflow including thinking process and agent execution
 */
export const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({
  workflow
}) => {
  if (!workflow) return null;

  // Check if thought is completed by whether agents field exists and has content
  const isThoughtCompleted = workflow.agents && workflow.agents.length > 0;

  return (
    <div className="workflow-display space-y-4">
      <div className='flex items-center gap-2'>
        <Atlas />
        <span className="text-lg font-bold text-text-01 dark:text-text-01-dark">Atlas</span>
      </div>

      {/* Thinking process - dark theme style */}
      {workflow.thought && (
        <ThinkingDisplay
          content={workflow.thought}
          isCompleted={isThoughtCompleted}
        />
      )}

      {/* Agent list - STEP format */}
      {workflow.agents && workflow.agents.length > 0 && (
        <div className="space-y-3">
          {workflow.agents.map((agent: any, index: number) => (
            <StepAgentDisplay
              key={agent.id || index}
              agent={agent}
            />
          ))}
        </div>
      )}
    </div>
  );
};
