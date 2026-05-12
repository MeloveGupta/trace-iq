'use client';

import { useState } from 'react';
import type { IToolExecution } from '@/types/composio';
import StepCard from './StepCard';
import DetailPanel from './DetailPanel';
import ReplayModal from './ReplayModal';

interface SessionTimelineProps { steps: IToolExecution[]; }

export default function SessionTimeline({ steps }: SessionTimelineProps) {
  const [selectedStep, setSelectedStep] = useState<IToolExecution | null>(null);
  const [replayStep, setReplayStep] = useState<IToolExecution | null>(null);

  const baseTime = steps.length > 0 ? new Date(steps[0].started_at).getTime() : 0;

  if (steps.length === 0) {
    return <div className="flex-1 flex items-center justify-center py-20"><p className="text-sm text-text-tertiary">No tool calls in this session</p></div>;
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className={`flex-1 overflow-y-auto px-5 py-4 ${selectedStep ? 'border-r border-border/40' : ''}`}>
        <div className="max-w-2xl">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              isSelected={selectedStep?.id === step.id}
              isLast={index === steps.length - 1}
              onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
              timeOffset={new Date(step.started_at).getTime() - baseTime}
              prevFinishedAt={index > 0 ? steps[index - 1].finished_at : undefined}
            />
          ))}
        </div>
      </div>

      {selectedStep && (
        <div className="w-[340px] shrink-0">
          <DetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} onReplay={() => setReplayStep(selectedStep)} />
        </div>
      )}

      {replayStep && <ReplayModal step={replayStep} onClose={() => setReplayStep(null)} />}
    </div>
  );
}
