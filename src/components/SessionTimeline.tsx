'use client';

import { useEffect, useState } from 'react';
import type { IToolExecution } from '@/types/composio';
import StepCard from './StepCard';
import DetailPanel from './DetailPanel';
import ReplayModal from './ReplayModal';

interface SessionTimelineProps { steps: IToolExecution[]; focusStepId?: string | null; }

export default function SessionTimeline({ steps, focusStepId }: SessionTimelineProps) {
  const [selectedStep, setSelectedStep] = useState<IToolExecution | null>(null);
  const [replayStep, setReplayStep] = useState<IToolExecution | null>(null);

  const baseTime = steps.length > 0 ? new Date(steps[0].started_at).getTime() : 0;

  useEffect(() => {
    if (!focusStepId) return;
    const nextStep = steps.find(step => step.id === focusStepId);
    if (nextStep) {
      const animationFrame = window.requestAnimationFrame(() => {
        setSelectedStep(nextStep);
        document.getElementById(`step-${focusStepId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return () => window.cancelAnimationFrame(animationFrame);
    }
  }, [focusStepId, steps]);

  if (steps.length === 0) {
    return <div className="flex-1 flex items-center justify-center py-20"><p className="text-sm text-text-tertiary">No tool calls in this session</p></div>;
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col xl:flex-row">
      <div className={`flex-1 overflow-y-auto px-5 py-4 ${selectedStep ? 'border-b border-border/40 xl:border-b-0 xl:border-r' : ''}`}>
        <div className="max-w-2xl">
          {steps.map((step, index) => (
            <div key={step.id} id={`step-${step.id}`}>
              <StepCard
                step={step}
                index={index}
                isSelected={selectedStep?.id === step.id}
                isLast={index === steps.length - 1}
                onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                timeOffset={new Date(step.started_at).getTime() - baseTime}
                prevFinishedAt={index > 0 ? steps[index - 1].finished_at : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedStep && (
        <div className="h-[48vh] w-full shrink-0 xl:h-auto xl:w-[380px]">
          <DetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} onReplay={() => setReplayStep(selectedStep)} />
        </div>
      )}

      {replayStep && <ReplayModal step={replayStep} onClose={() => setReplayStep(null)} />}
    </div>
  );
}
